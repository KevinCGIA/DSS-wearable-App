import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

export function loadAdapter(path, dependencies) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    setTimeout, clearTimeout, setInterval, clearInterval, atob, console, __DEV__: true,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected runtime dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}
