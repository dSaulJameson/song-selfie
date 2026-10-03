#!/usr/bin/env python3
"""Generated source-repository client for verified HostHatch production releases.

The source Actions job needs only a fine-grained token with Actions read/write
on the personal hosthatch-ops repository. It holds no SSH or K3s credential.
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path


OPS = "dSaulJameson/hosthatch-ops"
API = f"https://api.github.com/repos/{OPS}"


def request_json(url, token, payload=None):
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        method="POST" if body is not None else "GET",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "HostHatch-source-release/1",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                content = response.read()
                return json.loads(content) if content else {}
        except urllib.error.HTTPError as error:
            if error.code not in (502, 503, 504) or attempt == 4:
                raise RuntimeError(f"GitHub API HTTP {error.code} for {url}") from error
            time.sleep(2 ** attempt)
    raise AssertionError("unreachable")


def main():
    data = json.loads(Path(os.environ["RELEASE_METADATA_PATH"]).read_text())
    component = os.environ["RELEASE_COMPONENT"]
    repo = os.environ["GITHUB_REPOSITORY"]
    revision = os.environ["GITHUB_SHA"]
    image = data.get("image", "")
    package = os.environ["EXPECTED_IMAGE_PACKAGE"]
    expected_ref = "refs/heads/" + os.environ["SOURCE_DEFAULT_BRANCH"]
    if os.environ["GITHUB_REF"] != expected_ref:
        raise ValueError("production release must run on the default branch")
    if data.get("component") != component or data.get("repository", "").lower() != repo.lower():
        raise ValueError("image build artifact has wrong component or repository")
    if data.get("revision") != revision or not re.fullmatch(r"[0-9a-f]{40}", revision):
        raise ValueError("image build artifact has wrong source revision")
    if not re.fullmatch(re.escape(package) + r"@sha256:[0-9a-f]{64}", image):
        raise ValueError("image build artifact is not an immutable catalogued digest")
    dispatch_token = os.environ["PRODUCTION_RELEASE_DISPATCH_TOKEN"]
    if not dispatch_token:
        raise ValueError("PRODUCTION_RELEASE_DISPATCH_TOKEN is missing")

    audience = f"hosthatch-ops:production:{component}:{image}"
    oidc_url = os.environ["ACTIONS_ID_TOKEN_REQUEST_URL"]
    joiner = "&" if "?" in oidc_url else "?"
    attestation = request_json(
        oidc_url + joiner + urllib.parse.urlencode({"audience": audience}),
        os.environ["ACTIONS_ID_TOKEN_REQUEST_TOKEN"],
    )["value"]
    source_run_id = os.environ["GITHUB_RUN_ID"]
    before = datetime.now(timezone.utc) - timedelta(seconds=30)
    dispatched = request_json(
        API + "/actions/workflows/apply-production.yml/dispatches",
        dispatch_token,
        {
            "ref": "main",
            "inputs": {
                "component": component,
                "image": image,
                "source_revision": revision,
                "source_run_id": source_run_id,
                "attestation": attestation,
            },
        },
    )
    print(f"Dispatched {component} for {repo}@{revision} to {OPS}", flush=True)
    run_id = dispatched.get("workflow_run_id")
    expected_title = f"Release {component} at {revision} from {source_run_id}"
    for _ in range(360):
        if run_id:
            run = request_json(API + f"/actions/runs/{run_id}", dispatch_token)
        else:
            listing = request_json(
                API + "/actions/workflows/apply-production.yml/runs?event=workflow_dispatch&per_page=50",
                dispatch_token,
            )["workflow_runs"]
            matching = [
                candidate for candidate in listing
                if candidate.get("display_title") == expected_title
                and datetime.fromisoformat(candidate["created_at"].replace("Z", "+00:00")) >= before
            ]
            run = max(matching, key=lambda item: item["created_at"]) if matching else None
            if run:
                run_id = run["id"]
        if run and run["status"] == "completed":
            url = run["html_url"]
            if run["conclusion"] != "success":
                raise RuntimeError(f"production deployment failed: {url}")
            print(f"Verified production deployment: {url}", flush=True)
            Path(os.environ["GITHUB_STEP_SUMMARY"]).write_text(
                f"Verified production release of `{component}` at `{revision}` via {url}.\n"
            )
            return
        time.sleep(10)
    raise TimeoutError(f"production release did not complete: {component}@{revision}")


if __name__ == "__main__":
    try:
        main()
    except (KeyError, ValueError, RuntimeError, TimeoutError, OSError) as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from error
