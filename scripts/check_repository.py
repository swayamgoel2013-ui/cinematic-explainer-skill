#!/usr/bin/env python3
"""Validate the distributable skill, links, and absence of local project artifacts."""
import json
from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
SKILL=ROOT/'skills/cinematic-explainer'
EXCLUDED={'node_modules','.git','out','dist','__pycache__','.venv','.DS_Store'}

def validate():
    failures=[]
    required=['SKILL.md','LICENSE','agents/openai.yaml','scripts/create_project.py','scripts/import_captions.py','assets/remotion-template/package.json','assets/remotion-template/package-lock.json','assets/remotion-template/src/index.ts']
    for relative in required:
        if not (SKILL/relative).is_file():failures.append(f'Missing {relative}')
    text=(SKILL/'SKILL.md').read_text()
    front=re.match(r'^---\n(.*?)\n---\n',text,re.S)
    if not front:failures.append('Missing YAML frontmatter')
    else:
        fields={k:v.strip() for k,v in re.findall(r'^(name|description):\s*(.+)$',front.group(1),re.M)}
        if fields.get('name')!='cinematic-explainer':failures.append('Skill name must match folder')
        if not fields.get('description') or len(fields['description'])>1024:failures.append('Invalid skill description')
    for p in ROOT.rglob('*'):
        if any(part in EXCLUDED for part in p.relative_to(ROOT).parts):continue
        if p.is_symlink():failures.append(f'Unexpected symlink: {p.relative_to(ROOT)}');continue
        if not p.is_file():continue
        rel=p.relative_to(ROOT)
        if p.stat().st_size>50_000_000:failures.append(f'Unexpectedly large public asset: {rel}')
        if p.name.startswith('.env') or p.suffix.lower() in {'.mp3','.wav','.aiff','.m4a'}:failures.append(f'Private media/config should not be bundled: {rel}')
        if p.suffix in {'.md','.py','.mjs','.ts','.tsx','.json','.yaml','.yml','.html','.txt'}:
            content=p.read_text()
            if re.search(r'/(?:Users|home)/[^\s/]+/',content):failures.append(f'Personal filesystem path: {rel}')
            if re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bAKIA[A-Z0-9]{16}\b|\bsk-[A-Za-z0-9]{24,}\b',content):failures.append(f'Credential-like content: {rel}')
            if p.suffix=='.json':
                try:json.loads(content)
                except ValueError:failures.append(f'Invalid JSON: {rel}')
            if p.suffix=='.md':
                for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)',content):
                    if '://' in target or target.startswith('#'):continue
                    target=target.split('#',1)[0].strip('<>')
                    if target and not (p.parent/target).exists():failures.append(f'Broken link in {rel}: {target}')
    if failures:raise ValueError('\n'.join(failures))
    print('Repository validation passed: skill metadata, required assets, local links, JSON, and publication hygiene.')

if __name__=='__main__':
    try:validate()
    except (OSError,ValueError) as e:sys.exit(str(e))
