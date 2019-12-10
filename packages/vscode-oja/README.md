# vscode-oja

[![Visual Studio Marketplace](https://vsmarketplacebadge.apphb.com/installs-short/oja.vscode-oja.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=oja.vscode-oja)

VS Code extension for [oja-action](https://github.com/eBay/oja/blob/master/packages/oja-action#readme) dependency injection layer with action discovery and code completion.

This modue is a subset of [Oja](https://github.com/eBay/oja#readme) framework.

With the introduction of dependency injection, we lose the ability to easily navigate the code through import links.

This VS Code extension brings us back this functionality and even more - you can now view all reachable actions from the given point in a popup window.

![Demo Discovery](https://raw.githubusercontent.com/eBay/oja/master/packages/vscode-oja/images/vscode.gif)

The extension also does automatic validations for your project upon saving.

![Demo Linting](https://raw.githubusercontent.com/eBay/oja/master/packages/vscode-oja/images/oja-lint.gif)

## Install

1. Open VS Code
2. Press F1
3. Type "install"
4. Select "Extensions: Install Extension".
5. Select vscode-oja from the list

## External dependencies

The extension will work as longs as the following dependencies are installed as part of the application:

```bash
npm install @ebay/oja-context, @ebay/oja-action --save
npm install  @ebay/oja-linter --save-dev
```