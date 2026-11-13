#!/usr/bin/env python3
"""Build source-repository and standalone-skill ZIPs; no git or network required."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import hashlib
import json
from check_repository import ROOT,SKILL,EXCLUDED,validate

def archive(source,target,prefix):
    with ZipFile(target,'w',ZIP_DEFLATED,compresslevel=6) as z:
        for p in sorted(source.rglob('*')):
            relative=p.relative_to(source)
            if any(part in EXCLUDED for part in relative.parts) or not p.is_file():continue
            if p.is_symlink():raise ValueError(f'Symlink cannot be packaged: {relative}')
            z.write(p,Path(prefix)/relative)
    with ZipFile(target) as z:
        failure=z.testzip()
        if failure:raise ValueError(f'ZIP CRC failure: {failure}')
    return {'file':target.name,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}

def main():
    validate();dest=ROOT/'dist';dest.mkdir(exist_ok=True)
    results=[archive(ROOT,dest/'cinematic-explainer-skill.zip','cinematic-explainer-skill'),archive(SKILL,dest/'cinematic-explainer.zip','cinematic-explainer')]
    (dest/'manifest.json').write_text(json.dumps(results,indent=2)+'\n')
    for r in results:print(f'{r["file"]}: {r["bytes"]/1e6:.2f} MB; CRC passed; SHA256 {r["sha256"]}')

if __name__=='__main__':main()
