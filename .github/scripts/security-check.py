#!/usr/bin/env python3
"""Production CI gates. Verified tools; no registry credential in argv or reports."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tarfile
import urllib.request

TOOLS = {
    'trivy': ('aquasecurity/trivy', 'v0.75.0', 'trivy_0.75.0_Linux-64bit.tar.gz',
              'c6e65abddb348e25f10549df887045629cf28cc72453cd1c63acb717316b3f3f'),
    'gitleaks': ('gitleaks/gitleaks', 'v8.30.1', 'gitleaks_8.30.1_linux_x64.tar.gz',
                '551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb'),
}


def tool(name):
    repo, version, asset, digest = TOOLS[name]
    directory = Path(os.environ.get('RUNNER_TEMP', '/tmp'))/'hosthatch-security'/name
    directory.mkdir(parents=True, exist_ok=True)
    archive = directory/asset
    request = urllib.request.Request(f'https://github.com/{repo}/releases/download/{version}/{asset}',
                                     headers={'User-Agent': 'hosthatch-security/1'})
    with urllib.request.urlopen(request, timeout=120) as response, archive.open('wb') as out:
        while block := response.read(1024*1024): out.write(block)
    with archive.open('rb') as stream:
        if hashlib.file_digest(stream, 'sha256').hexdigest() != digest:
            raise ValueError('Security tool checksum mismatch')
    with tarfile.open(archive) as package:
        package.extractall(directory, filter='data')
    return str(directory/name)


def main():
    parser=argparse.ArgumentParser();parser.add_argument('mode',choices=['source','image']);parser.add_argument('image',nargs='?');args=parser.parse_args()
    reports=Path('security-reports');reports.mkdir(exist_ok=True)
    if args.mode=='source':
        # Check the incoming commit; full existing history has a separately recorded audit.
        config=reports/'gitleaks.toml';config.write_text('title="Independent source gate"\n[extend]\nuseDefault=true\n')
        ignore=reports/'empty.ignore';ignore.write_text('')
        command=[tool('gitleaks'),'git','.', '--log-opts=-1','--redact=100','--no-banner',
                 '--ignore-gitleaks-allow','--config',str(config),'--gitleaks-ignore-path',str(ignore),
                 '--report-format','json','--report-path',str(reports/'secrets.json')]
        raise SystemExit(subprocess.run(command).returncode)
    if not args.image or '@sha256:' not in args.image: raise ValueError('Immutable image required')
    report=reports/'image.json'
    subprocess.run([tool('trivy'),'image','--scanners','vuln','--skip-check-update','--timeout','15m',
                    '--format','json','--output',str(report),args.image],check=True)
    data=json.loads(report.read_text())
    blocked=[]
    for target in data.get('Results',[]):
        for finding in target.get('Vulnerabilities',[]):
            if finding.get('Severity')=='CRITICAL' and finding.get('FixedVersion'):
                blocked.append({k:finding.get(k) for k in ['VulnerabilityID','PkgName','InstalledVersion','FixedVersion']})
    print(json.dumps({'fixed_critical_gate_failures':blocked}))
    if blocked: raise SystemExit(1)


if __name__=='__main__':main()
