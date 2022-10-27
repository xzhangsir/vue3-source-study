"use strict";
var VueReactivity = (() => {
  // packages/shared/src/index.ts
  var isObject = (val) => {
    return typeof val === "object" && val !== null;
  };

  // packages/reactivity/src/index.ts
  console.log(isObject(123));
})();
//# sourceMappingURL=reactivity.global.js.map
