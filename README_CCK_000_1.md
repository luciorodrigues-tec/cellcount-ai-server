# CCK-000.1 — Engineering Foundation

This release adds the enterprise engineering foundation without changing the
approved clinical or morphology runtime.

## Included

- versioned engineering configuration;
- coding, testing, documentation and release standards;
- enterprise module templates;
- module scaffold generator;
- architecture dependency checker;
- test discovery runner;
- foundation validator;
- benchmark script;
- ADRs and sprint specification;
- automated tests and regression guard.

## Validation

```bat
node --check engineering\scripts\generateModule.mjs
node engineering\scripts\validateFoundation.mjs
node engineering\scripts\checkArchitecture.mjs

node tests\cck0001_config_test.mjs
node tests\cck0001_template_contract_test.mjs
node tests\cck0001_generator_test.mjs
node tests\cck0001_architecture_test.mjs
node tests\cck0001_foundation_validation_test.mjs
node tests\cck0001_regression_test.mjs
```

## Module generation example

```bat
node engineering\scripts\generateModule.mjs "CCK-001" "Kernel Foundation" "kernel\cck001"
```
