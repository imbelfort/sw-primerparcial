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
        
        /**
         * The model (graph) associated with this paper.
         */
        model: Graph;
      }
      
      interface Graph {
        /**
         * Get a cell by its ID.
         */
        getCell(id: string): Cell | null;
      }
      
      interface Cell {
        /**
         * Check if this cell is a link.
         */
        isLink(): boolean;
        
        /**
         * Get a property value.
         */
        get(property: string): any;
        
        /**
         * Set a property value.
         */
        set(property: string, value: any): void;
      }
      
      interface Link extends Cell {
        /**
         * Get source connection.
         */
        source(): { id: string; anchor?: any };
        
        /**
         * Get target connection.
         */
        target(): { id: string; anchor?: any };
        
        /**
         * Get source cell.
         */
        getSourceCell(): Element;
        
        /**
         * Get target cell.
         */
        getTargetCell(): Element;
        
        /**
         * Get or set labels.
         */
        labels(labels?: any[]): any[];
      }
      
      interface Element extends Cell {
        /**
         * Get bounding box.
         */
        getBBox(): { x: number; y: number; width: number; height: number };
      }
      
      interface LinkView {
        sourceBBox: any;
        targetBBox: any;
        sourceAnchor: any;
        targetAnchor: any;
      }
      
      interface ElementView {
        model: Element;
      }
      
      interface Label {
        attrs: {
          text: {
            textAnchor?: string;
            [key: string]: any;
          };
          [key: string]: any;
        };
        position: {
          distance: number;
          [key: string]: any;
        };
        [key: string]: any;
      }
      
      interface Tool {
        [key: string]: any;
      }
      
      interface Anchor {
        [key: string]: any;
      }
      
      interface Marker {
        type: string;
        d: string;
        fill?: string;
        stroke?: string;
        'stroke-width'?: number;
        [key: string]: any;
      }
    }
    
    namespace g {
      interface Point {
        x: number;
        y: number;
        clone(): Point;
        snapToGrid(gridSize: number): void;
      }
    }
    
    namespace util {
      function cloneDeep(obj: any): any;
      function toKebabCase(str: string): string;
      function getRectPoint(bbox: any, side: string): Point;
      function normalizeSides(sides: any): any;
      function defaultsDeep(target: any, ...sources: any[]): any;
    }
    
    namespace shapes {
      namespace standard {
        class Link {
          constructor(attributes?: any);
          defaults(): any;
        }
        
        class Record {
          constructor(attributes?: any);
          defaults(): any;
        }
      }
      
      namespace uml {
        class Association extends standard.Link {}
        class Aggregation extends standard.Link {}
        class Composition extends standard.Link {}
        class Dependency extends standard.Link {}
        class Generalization extends standard.Link {}
        class Class extends standard.Record {}
        class Component extends standard.Record {}
      }
    }
    
    namespace elementTools {
      class Boundary {
        constructor(options?: any);
      }
    }
    
    namespace linkTools {
      class SourceAnchor {
        constructor(options?: any);
      }
      
      class TargetAnchor {
        constructor(options?: any);
      }
      
      class Vertices {
        constructor(options?: any);
      }
      
      class Segments {
        constructor(options?: any);
      }
      
      class SourceArrowhead {
        constructor(options?: any);
      }
      
      class TargetArrowhead {
        constructor(options?: any);
      }
      
      class Remove {
        constructor(options?: any);
      }
    }
    
    namespace dia {
      class ToolsView {
        constructor(options: { tools: any[] });
      }
    }
    
    namespace connectionStrategies {
      function pinAbsolute(options: any, view: any, magnet: any, coords: any): any;
    }
  }
  
  const joint: typeof joint;
  export = joint;
}

export {};
