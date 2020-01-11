# swiftlint-to-md

![npm](https://img.shields.io/npm/v/swiftlint-to-md?style=for-the-badge)

A utility to convert the [SwiftLint](https://github.com/realm/SwiftLint) JSON output to a markdown format that is intended for a GitHub check summary or text area.

To install:

```
npm install -g swiftlint-to-md
```

To generate a summary section:

```
swiftlint-to-md /path/to/json/output summary
```

To generate a text section:

```
swiftlint-to-md /path/to/json/output text
```
