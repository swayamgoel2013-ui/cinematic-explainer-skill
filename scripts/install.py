#!/usr/bin/env python3
"""Install the bundled skill without dependencies or network access."""
import argparse
import os
from pathlib import Path
import shutil
import sys
import tempfile
from datetime import datetime, timezone

NAME = 'cinematic-explainer'
SOURCE = Path(__file__).resolve().parents[1] / 'skills' / NAME

def install(base: Path, replace: bool = False) -> Path:
    source = SOURCE.resolve()
    if not (source / 'SKILL.md').is_file():
        raise ValueError(f'Missing skill entrypoint: {source / "SKILL.md"}')
    if any(p.is_symlink() for p in source.rglob('*')):
        raise ValueError('Skill source contains a symlink; refusing an ambiguous installation.')
    base = base.expanduser().resolve()
    dest = base / NAME
    if dest.is_symlink():
        raise ValueError(f'Refusing to replace a symlink: {dest}')
    if source == dest or source in dest.parents or dest in source.parents:
        raise ValueError('Install destination must be outside the repository skill source.')
    if dest.exists() and not replace:
        raise FileExistsError(f'{dest} already exists. Use --replace to install with a backup.')
    base.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix=f'.{NAME}-', dir=base))
    backup = None
    try:
        shutil.copytree(source, stage / NAME, ignore=shutil.ignore_patterns('__pycache__', '*.pyc', 'node_modules', 'out', '.DS_Store'))
        if dest.exists():
            stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
            backup = base / f'{NAME}.backup-{stamp}'
            dest.rename(backup)
        try:
            (stage / NAME).rename(dest)
        except Exception:
            if backup is not None:
                backup.rename(dest)
            raise
    finally:
        shutil.rmtree(stage, ignore_errors=True)
    if backup:
        print(f'Previous installation saved to {backup}')
    return dest

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    default = Path(os.environ.get('CODEX_HOME', str(Path.home() / '.codex'))) / 'skills'
    parser.add_argument('--dest', type=Path, default=default, help='Skills directory (default: $CODEX_HOME/skills or ~/.codex/skills).')
    parser.add_argument('--replace', action='store_true', help='Replace an installed copy, retaining a timestamped backup.')
    args = parser.parse_args()
    try:
        destination = install(args.dest, args.replace)
    except (OSError, ValueError) as exc:
        parser.exit(1, f'Install failed: {exc}\n')
    print(f'Installed {NAME}: {destination}')
    print('In Codex, use $cinematic-explainer on your next turn.')

if __name__ == '__main__':
    main()
