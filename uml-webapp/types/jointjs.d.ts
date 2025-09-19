// Type definitions for JointJS with additional methods

declare module 'jointjs' {
  namespace joint {
    namespace dia {
      interface Paper {
        /**
         * Renders the paper and all its attached views.
         * This method is not included in the default TypeScript definitions but exists in the runtime.
         */
        render(): void;
        
        /**
         * The underlying SVG element of the paper.
         * This is a reference to the actual DOM element.
         */
        el: SVGElement;
      }
    }
  }
}

export {};
