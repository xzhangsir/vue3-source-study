var VueCompilerCore = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b ||= {})
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/compiler-core/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    compile: () => compile
  });

  // packages/compiler-core/src/runtimeHelpers.ts
  var TO_DISPLAY_STRING = Symbol("toDisplayString");
  var CREATE_TEXT = Symbol("createTextVnode");
  var CREATE_ELEMENT_VNODE = Symbol("createElementVnode");
  var OPEN_BLOCK = Symbol("openBlock");
  var CREATE_ELEMENT_BLOCK = Symbol("createElementBlock");
  var FRAGMENT = Symbol("fragment");
  var helperMap = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_TEXT]: "createTextVnode",
    [CREATE_ELEMENT_VNODE]: "createElementVnode",
    [OPEN_BLOCK]: "openBlock",
    [CREATE_ELEMENT_BLOCK]: "createElementBlock",
    [FRAGMENT]: "fragment"
  };

  // packages/compiler-core/src/ast.ts
  function createCallExpression(context, args) {
    let callee = context.helper(CREATE_TEXT);
    return {
      callee,
      type: 14 /* JS_CALL_EXPRESSION */,
      arguments: args
    };
  }
  function createObjectExpression(properties) {
    return {
      type: 15 /* JS_OBJECT_EXPRESSION */,
      properties
    };
  }
  function createVnodeCall(context, vnodeTag, propsExpression, childrenNode) {
    let callee = context.helper(CREATE_ELEMENT_VNODE);
    return {
      callee,
      tag: vnodeTag,
      type: 13 /* VNODE_CALL */,
      children: childrenNode,
      props: propsExpression
    };
  }

  // packages/compiler-core/src/parse.ts
  function parse(template) {
    const context = createParserContext(template);
    const start = getCursor(context);
    return createRoot(parseChildren(context), getSelection(context, start));
  }
  function createRoot(children, loc) {
    return {
      type: 0 /* ROOT */,
      children,
      loc
    };
  }
  function parseChildren(context) {
    const nodes = [];
    while (!isEnd(context)) {
      const source = context.source;
      let node;
      if (source.startsWith("{{")) {
        node = parseInterpolation(context);
      } else if (source.startsWith("<")) {
        node = parseElement(context);
      }
      if (!node) {
        node = parseText(context);
      }
      nodes.push(node);
    }
    return nodes;
  }
  function createParserContext(template) {
    return {
      line: 1,
      column: 1,
      offset: 0,
      source: template,
      originalSource: template
    };
  }
  function isEnd(context) {
    const source = context.source;
    if (source.startsWith("</")) {
      return true;
    }
    return !source;
  }
  function parseInterpolation(context) {
    const start = getCursor(context);
    const closeIndex = context.source.indexOf("}}", "{{".length);
    advanceBy(context, 2);
    const innerStart = getCursor(context);
    const innerEnd = getCursor(context);
    const rawContentLength = closeIndex - 2;
    let preContent = parseTextData(context, rawContentLength);
    let content = preContent.trim();
    let startOffset = preContent.indexOf(content);
    if (startOffset > 0) {
      advancePositionWithMutation(innerStart, preContent, startOffset);
    }
    let endOffset = startOffset + content.length;
    advancePositionWithMutation(innerEnd, preContent, endOffset);
    advanceBy(context, 2);
    return {
      type: 5 /* INTERPOLATION */,
      context: {
        type: 4 /* SIMPLE_EXPRESSION */,
        content,
        loc: getSelection(context, innerStart, innerEnd)
      },
      loc: getSelection(context, start)
    };
  }
  function parseElement(context) {
    let ele = parseTag(context);
    let children = parseChildren(context);
    if (context.source.startsWith("</")) {
      parseTag(context);
    }
    ele.loc = getSelection(context, ele.loc.start);
    ele.children = children;
    return ele;
  }
  function parseText(context) {
    let endTokens = ["<", "{{"];
    let endIndex = context.source.length;
    for (let i = 0; i < endTokens.length; i++) {
      let index = context.source.indexOf(endTokens[i], 1);
      if (index !== -1 && endIndex > index) {
        endIndex = index;
      }
    }
    const start = getCursor(context);
    const content = parseTextData(context, endIndex);
    return {
      type: 2 /* TEXT */,
      content,
      loc: getSelection(context, start)
    };
  }
  function parseTag(context) {
    const start = getCursor(context);
    const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
    const tag = match[1];
    advanceBy(context, match[0].length);
    advanceBySpaces(context);
    let props = parseAttributes(context);
    let isSelfClosing = context.source.startsWith("/>");
    advanceBy(context, isSelfClosing ? 2 : 1);
    return {
      type: 1 /* ELEMENT */,
      tag,
      isSelfClosing,
      children: [],
      props,
      loc: getSelection(context, start)
    };
  }
  function advanceBySpaces(context) {
    let match = /^[ \t\r\n]+/.exec(context.source);
    if (match) {
      advanceBy(context, match[0].length);
    }
  }
  function parseAttributes(context) {
    const props = [];
    let source = context.source;
    while (source.length > 0 && !(source.startsWith(">") || source.startsWith("/>"))) {
      const prop = parseAttribute(context);
      props.push(prop);
      advanceBySpaces(context);
      source = context.source;
    }
    return props;
  }
  function parseAttribute(context) {
    const start = getCursor(context);
    const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
    let name = match[0];
    advanceBy(context, name.length);
    advanceBySpaces(context);
    advanceBy(context, 1);
    advanceBySpaces(context);
    let value = parseAttributeValue(context);
    return {
      type: 6 /* ATTRIBUTE */,
      name,
      value: __spreadValues({
        type: 2 /* TEXT */
      }, value),
      loc: getSelection(context, start)
    };
  }
  function parseAttributeValue(context) {
    const start = getCursor(context);
    let quote = context.source[0];
    let content;
    if (quote == '"' || quote == "'") {
      advanceBy(context, 1);
      const endIndex = context.source.indexOf(quote);
      content = parseTextData(context, endIndex);
      advanceBy(context, 1);
    }
    return {
      content,
      loc: getSelection(context, start)
    };
  }
  function getCursor(context) {
    let { line, column, offset } = context;
    return { line, column, offset };
  }
  function parseTextData(context, endIndex) {
    const rawText = context.source.slice(0, endIndex);
    advanceBy(context, endIndex);
    return rawText;
  }
  function advanceBy(context, endIndex) {
    let source = context.source;
    advancePositionWithMutation(context, source, endIndex);
    context.source = source.slice(endIndex);
  }
  function advancePositionWithMutation(context, source, endIndex) {
    let linesCount = 0;
    let linePos = -1;
    for (let i = 0; i < endIndex; i++) {
      if (source.charCodeAt(i) == 10) {
        linesCount++;
        linePos = i;
      }
    }
    context.line += linesCount;
    context.offset += endIndex;
    context.column = linePos == -1 ? context.column + endIndex : endIndex - linePos;
  }
  function getSelection(context, start, end) {
    end = end || getCursor(context);
    return {
      start,
      end,
      source: context.originalSource.slice(start.offset, end.offset)
    };
  }

  // packages/compiler-core/src/transforms/transformElement.ts
  function transformElement(node, context) {
    if (node.type === 1 /* ELEMENT */) {
      return () => {
        console.log("\u5143\u7D20");
        let vnodeTag = `${node.tag}`;
        let properties = [];
        let props = node.props;
        for (let i = 0; i < props.length; i++) {
          properties.push({
            key: props[i].name,
            value: props[i].value.content
          });
        }
        console.log("properties", properties);
        const propsExpression = properties.length > 0 ? createObjectExpression(properties) : null;
        let childrenNode = null;
        if (node.children.length == 1) {
          childrenNode = node.children[0];
        } else if (node.children.length > 1) {
          childrenNode = node.children;
        }
        node.codegenNode = createVnodeCall(context, vnodeTag, propsExpression, childrenNode);
      };
    }
  }

  // packages/compiler-core/src/transforms/transformExpression.ts
  function transformExpression(node, context) {
    if (node.type === 5 /* INTERPOLATION */) {
      console.log("{{}}", node);
      let content = node.context.content;
      node.context.content == `__ctx.${content}`;
    }
  }

  // packages/shared/src/index.ts
  var isArray = Array.isArray;

  // packages/compiler-core/src/transforms/transformText.ts
  function transformText(node, context) {
    if (node.type === 1 /* ELEMENT */ || node.type === 0 /* ROOT */) {
      return () => {
        console.log("\u6587\u672C");
        let currentContainer = null;
        let children = node.children;
        let hasText = null;
        for (let i = 0; i < children.length; i++) {
          let child = children[i];
          hasText = true;
          if (isText(child)) {
            for (let j = i + 1; j < children.length; j++) {
              let next = children[j];
              if (isText(next)) {
                if (!currentContainer) {
                  currentContainer = children[i] = {
                    type: 8 /* COMPOUND_EXPRESSION */,
                    children: [child]
                  };
                }
                currentContainer.children.push("+", next);
                children.splice(j, 1);
                j--;
              } else {
                currentContainer = null;
                break;
              }
            }
          }
        }
        console.log("children", children);
        if (!hasText || children.length == 1) {
          return;
        }
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const callArgs = [];
          if (isText(child) || child.type === 8 /* COMPOUND_EXPRESSION */) {
            callArgs.push(child);
            if (node.type !== 2 /* TEXT */) {
              callArgs.push(1 /* TEXT */);
            }
            children[i] = {
              type: 12 /* TEXT_CALL */,
              content: child,
              codegenNode: createCallExpression(context, callArgs)
            };
          }
        }
      };
    }
  }
  function isText(node) {
    return node.type === 5 /* INTERPOLATION */ || node.type === 2 /* TEXT */;
  }

  // packages/compiler-core/src/transforms.ts
  function transform(ast) {
    const context = createTransformContext(ast);
    console.log(ast, context);
    traverse(ast, context);
    createRootCodegen(ast, context);
    ast.helpers = [...context.helpers.keys()];
  }
  function createTransformContext(root) {
    const context = {
      currentNode: root,
      parent: null,
      helpers: /* @__PURE__ */ new Map(),
      helper(name) {
        const count = context.helpers.get(name) || 0;
        context.helpers.set(name, count + 1);
        return name;
      },
      removeHelper(name) {
        const count = context.helpers.get(name);
        if (count) {
          const currentCount = count - 1;
          if (currentCount) {
            context.helpers.set(name, count);
          } else {
            context.helpers.delete(name);
          }
        }
      },
      nodeTransforms: [
        transformElement,
        transformText,
        transformExpression
      ]
    };
    return context;
  }
  function traverse(node, context) {
    context.currentNode = node;
    const transforms = context.nodeTransforms;
    const exitsFns = [];
    for (let i2 = 0; i2 < transforms.length; i2++) {
      let onExit = transforms[i2](node, context);
      onExit && exitsFns.push(onExit);
      if (!context.currentNode)
        return;
    }
    switch (node.type) {
      case 5 /* INTERPOLATION */:
        context.helper(TO_DISPLAY_STRING);
        break;
      case 1 /* ELEMENT */:
      case 0 /* ROOT */:
        for (let i2 = 0; i2 < node.children.length; i2++) {
          context.parent = node;
          traverse(node.children[i2], context);
        }
        break;
    }
    context.currentNode = node;
    let i = exitsFns.length;
    while (i--) {
      exitsFns[i]();
    }
  }
  function createRootCodegen(ast, context) {
    let { children } = ast;
    if (children.length === 1) {
      const child = children[0];
      if (child.type === 1 /* ELEMENT */ && child.codegenNode) {
        ast.codegenNode = child.codegenNode;
        context.removeHelper(CREATE_ELEMENT_VNODE);
        context.helper(OPEN_BLOCK);
        context.helper(CREATE_ELEMENT_BLOCK);
        ast.codegenNode.isBlock = true;
      } else {
        ast.codegenNode = child.codegenNode;
      }
    } else {
      ast.codegenNode = createVnodeCall(context, context.helper(FRAGMENT), null, ast.children);
      context.helper(OPEN_BLOCK);
      context.helper(CREATE_ELEMENT_BLOCK);
      ast.codegenNode.isBlock = true;
    }
  }

  // packages/compiler-core/src/index.ts
  function compile(template) {
    const ast = parse(template);
    transform(ast);
    return ast;
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=compiler-core.global.js.map
