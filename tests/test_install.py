import importlib.util
from pathlib import Path
import tempfile
import unittest
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('skill_install',ROOT/'scripts/install.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class InstallerTests(unittest.TestCase):
    def test_copy_is_complete_and_existing_install_is_preserved(self):
        with tempfile.TemporaryDirectory() as d:
            installed=module.install(Path(d))
            self.assertTrue((installed/'SKILL.md').is_file())
            self.assertTrue((installed/'assets/remotion-template/src/index.ts').is_file())
            (installed/'local-change.txt').write_text('keep me')
            with self.assertRaises(FileExistsError):module.install(Path(d))
            module.install(Path(d),True)
            backups=list(Path(d).glob('cinematic-explainer.backup-*'))
            self.assertEqual(len(backups),1)
            self.assertEqual((backups[0]/'local-change.txt').read_text(),'keep me')
            self.assertFalse((installed/'local-change.txt').exists())
    def test_refuses_installing_over_the_source(self):
        with self.assertRaises(ValueError):module.install(module.SOURCE.parent,True)
if __name__=='__main__':unittest.main()
