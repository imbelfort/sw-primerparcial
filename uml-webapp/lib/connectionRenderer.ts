// uml-webapp/lib/connectionRenderer.ts
// Sistema de renderizado de conexiones basado en la lógica propuesta

import * as joint from "jointjs";

/**
 * Clase base para conexiones UML
 * Basada en la lógica propuesta para renderizado ortogonal
 */
export class Connection {
  public b1: any; // Elemento origen
  public b2: any; // Elemento destino

  constructor(b1: any, b2: any) {
    this.b1 = b1;
    this.b2 = b2;
  }

  /**
   * Renderiza la conexión en el contexto del canvas
   * @param ctx Contexto del canvas
   * @param trackCallback Callback opcional para obtener los puntos de la trayectoria
   */
  render(ctx: CanvasRenderingContext2D, trackCallback?: (track: Array<{x: number, y: number}>) => void) {
    const b1 = this.b1;
    const b2 = this.b2;
    
    // Calcular centros de los elementos
    const c1 = {
      x: b1.x + b1.width / 2, 
      y: b1.y + b1.height / 2
    };
    const c2 = {
      x: b2.x + b2.width / 2, 
      y: b2.y + b2.height / 2
    };

    const track: Array<{x: number, y: number}> = [];
    let reverse = false;
    let first: {x: number, y: number}, last: {x: number, y: number};
    
    const xDiff = Math.abs(c1.x - c2.x);
    const yDiff = Math.abs(c1.y - c2.y);
    
    // Determinar si la conexión es principalmente horizontal o vertical
    if (xDiff > yDiff) {
      // Conexión horizontal
      if (c1.x < c2.x) {
        first = c1;
        last = c2;
      } else {
        reverse = true;
        first = c2;
        last = c1;
      }
      
      // Crear trayectoria ortogonal horizontal
      track.push(first);
      track.push({x: first.x + xDiff / 2, y: first.y});
      track.push({x: first.x + xDiff / 2, y: last.y});
      track.push(last);
    } else {
      // Conexión vertical
      if (c1.y < c2.y) {
        first = c1;
        last = c2;
      } else {
        reverse = true;
        first = c2;
        last = c1;
      }
      
      // Crear trayectoria ortogonal vertical
      track.push(first);
      track.push({x: first.x, y: first.y + yDiff / 2});
      track.push({x: last.x, y: first.y + yDiff / 2});
      track.push(last);
    }
    
    // Invertir la trayectoria si es necesario
    if (reverse) {
      track.reverse();
    }
    
    // Renderizar la línea
    ctx.beginPath();
    ctx.moveTo(track[0].x, track[0].y);
    for (let i = 1; i < 4; i++) {
      ctx.lineTo(track[i].x, track[i].y);
    }
    ctx.stroke();
    
    // Llamar callback si se proporciona
    if (trackCallback) {
      trackCallback(track);
    }
  }
}

/**
 * Clase para conexiones de delegación
 * Extiende Connection y añade flecha de delegación
 */
export class Delegation extends Connection {
  constructor(child: any, parent: any) {
    super(child, parent);
  }

  /**
   * Renderiza la conexión de delegación con flecha especial
   * @param ctx Contexto del canvas
   */
  render(ctx: CanvasRenderingContext2D) {
    let track: Array<{x: number, y: number}> = [];
    
    // Usar el renderizado base y capturar la trayectoria
    super.render(ctx, (points) => {
      track = points;
    });
    
    // La trayectoria comienza desde el padre (b2)
    const first = track[3]; // Último punto (donde termina la línea)
    const second = track[2]; // Penúltimo punto
    
    let arrowFirst: {x: number, y: number};
    let arrowSecond: {x: number, y: number};
    let arrowThird: {x: number, y: number};
    let arrowFourth: {x: number, y: number};

    // Determinar la orientación de la flecha basándose en la dirección
    if (track[3].y === track[2].y) {
      // Flecha horizontal
      if (track[3].x > track[2].x) {
        // Flecha apuntando hacia la izquierda
        arrowFirst = {x: this.b2.x, y: track[3].y};
        arrowSecond = {x: arrowFirst.x - 3, y: arrowFirst.y - 3};
        arrowThird = {x: arrowFirst.x - 3, y: arrowFirst.y + 3};
        arrowFourth = {x: arrowFirst.x - 5, y: arrowFirst.y};
      } else {
        // Flecha apuntando hacia la derecha
        arrowFirst = {x: this.b2.x + this.b2.width, y: track[3].y};
        arrowSecond = {x: arrowFirst.x + 3, y: arrowFirst.y - 3};
        arrowThird = {x: arrowFirst.x + 3, y: arrowFirst.y + 3};
        arrowFourth = {x: arrowFirst.x + 5, y: arrowFirst.y};
      }
    } else {
      // Flecha vertical
      if (track[3].y > track[2].y) {
        // Flecha apuntando hacia arriba
        arrowFirst = {x: track[3].x, y: this.b2.y};
        arrowSecond = {x: arrowFirst.x - 3, y: arrowFirst.y - 3};
        arrowThird = {x: arrowFirst.x + 3, y: arrowFirst.y - 3};
        arrowFourth = {x: arrowFirst.x, y: arrowFirst.y - 6};
      } else {
        // Flecha apuntando hacia abajo
        arrowFirst = {x: track[3].x, y: this.b2.y + this.b2.height};
        arrowSecond = {x: arrowFirst.x - 3, y: arrowFirst.y + 3};
        arrowThird = {x: arrowFirst.x + 3, y: arrowFirst.y + 3};
        arrowFourth = {x: arrowFirst.x, y: arrowFirst.y + 6};
      }
    }
    
    // Renderizar la flecha de delegación
    ctx.beginPath();
    ctx.moveTo(arrowFirst.x, arrowFirst.y);
    ctx.lineTo(arrowSecond.x, arrowSecond.y);
    ctx.lineTo(arrowFourth.x, arrowFourth.y);
    ctx.lineTo(arrowThird.x, arrowThird.y);
    ctx.lineTo(arrowFirst.x, arrowFirst.y);
    ctx.stroke();
  }
}

/**
 * Clase para conexiones de herencia
 * Extiende Connection y añade flecha de herencia (triángulo hueco)
 */
export class Inheritance extends Connection {
  constructor(child: any, parent: any) {
    super(child, parent);
  }

  /**
   * Renderiza la conexión de herencia con flecha triangular
   * @param ctx Contexto del canvas
   */
  render(ctx: CanvasRenderingContext2D) {
    let track: Array<{x: number, y: number}> = [];
    
    // Usar el renderizado base y capturar la trayectoria
    super.render(ctx, (points) => {
      track = points;
    });
    
    // Renderizar flecha de herencia (triángulo hueco)
    const endPoint = track[3];
    const direction = track[2];
    
    const arrowSize = 8;
    const dx = endPoint.x - direction.x;
    const dy = endPoint.y - direction.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length > 0) {
      const unitX = dx / length;
      const unitY = dy / length;
      
      // Calcular puntos del triángulo
      const arrowPoint1 = {
        x: endPoint.x - arrowSize * unitX,
        y: endPoint.y - arrowSize * unitY
      };
      
      const arrowPoint2 = {
        x: arrowPoint1.x - arrowSize * 0.5 * unitY,
        y: arrowPoint1.y + arrowSize * 0.5 * unitX
      };
      
      const arrowPoint3 = {
        x: arrowPoint1.x + arrowSize * 0.5 * unitY,
        y: arrowPoint1.y - arrowSize * 0.5 * unitX
      };
      
      // Renderizar triángulo hueco
      ctx.beginPath();
      ctx.moveTo(endPoint.x, endPoint.y);
      ctx.lineTo(arrowPoint2.x, arrowPoint2.y);
      ctx.lineTo(arrowPoint3.x, arrowPoint3.y);
      ctx.closePath();
      ctx.stroke();
    }
  }
}

/**
 * Clase para conexiones de composición
 * Extiende Connection y añade diamante relleno
 */
export class Composition extends Connection {
  constructor(whole: any, part: any) {
    super(whole, part);
  }

  /**
   * Renderiza la conexión de composición con diamante relleno
   * @param ctx Contexto del canvas
   */
  render(ctx: CanvasRenderingContext2D) {
    let track: Array<{x: number, y: number}> = [];
    
    // Usar el renderizado base y capturar la trayectoria
    super.render(ctx, (points) => {
      track = points;
    });
    
    // Renderizar diamante de composición (relleno)
    const startPoint = track[0];
    const direction = track[1];
    
    const diamondSize = 8;
    const dx = direction.x - startPoint.x;
    const dy = direction.y - startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length > 0) {
      const unitX = dx / length;
      const unitY = dy / length;
      
      // Calcular puntos del diamante
      const diamondCenter = {
        x: startPoint.x + diamondSize * unitX,
        y: startPoint.y + diamondSize * unitY
      };
      
      const diamondPoints = [
        {x: diamondCenter.x, y: diamondCenter.y - diamondSize},
        {x: diamondCenter.x + diamondSize, y: diamondCenter.y},
        {x: diamondCenter.x, y: diamondCenter.y + diamondSize},
        {x: diamondCenter.x - diamondSize, y: diamondCenter.y}
      ];
      
      // Renderizar diamante relleno
      ctx.beginPath();
      ctx.moveTo(diamondPoints[0].x, diamondPoints[0].y);
      for (let i = 1; i < diamondPoints.length; i++) {
        ctx.lineTo(diamondPoints[i].x, diamondPoints[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
}

/**
 * Clase para conexiones de agregación
 * Extiende Connection y añade diamante hueco
 */
export class Aggregation extends Connection {
  constructor(whole: any, part: any) {
    super(whole, part);
  }

  /**
   * Renderiza la conexión de agregación con diamante hueco
   * @param ctx Contexto del canvas
   */
  render(ctx: CanvasRenderingContext2D) {
    let track: Array<{x: number, y: number}> = [];
    
    // Usar el renderizado base y capturar la trayectoria
    super.render(ctx, (points) => {
      track = points;
    });
    
    // Renderizar diamante de agregación (hueco)
    const startPoint = track[0];
    const direction = track[1];
    
    const diamondSize = 8;
    const dx = direction.x - startPoint.x;
    const dy = direction.y - startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length > 0) {
      const unitX = dx / length;
      const unitY = dy / length;
      
      // Calcular puntos del diamante
      const diamondCenter = {
        x: startPoint.x + diamondSize * unitX,
        y: startPoint.y + diamondSize * unitY
      };
      
      const diamondPoints = [
        {x: diamondCenter.x, y: diamondCenter.y - diamondSize},
        {x: diamondCenter.x + diamondSize, y: diamondCenter.y},
        {x: diamondCenter.x, y: diamondCenter.y + diamondSize},
        {x: diamondCenter.x - diamondSize, y: diamondCenter.y}
      ];
      
      // Renderizar diamante hueco
      ctx.beginPath();
      ctx.moveTo(diamondPoints[0].x, diamondPoints[0].y);
      for (let i = 1; i < diamondPoints.length; i++) {
        ctx.lineTo(diamondPoints[i].x, diamondPoints[i].y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
}

/**
 * Factory para crear conexiones según el tipo
 */
export class ConnectionFactory {
  static create(type: string, source: any, target: any): Connection {
    switch (type) {
      case 'delegation':
        return new Delegation(source, target);
      case 'inheritance':
      case 'generalization':
        return new Inheritance(source, target);
      case 'composition':
        return new Composition(source, target);
      case 'aggregation':
        return new Aggregation(source, target);
      default:
        return new Connection(source, target);
    }
  }
}

/**
 * Utilidades para integrar con JointJS
 */
export class JointJSConnectionRenderer {
  /**
   * Convierte un elemento JointJS a formato compatible con Connection
   */
  static elementToConnectionFormat(element: joint.dia.Element): any {
    const bbox = element.getBBox();
    return {
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height
    };
  }

  /**
   * Renderiza una conexión en un canvas usando el sistema propuesto
   */
  static renderConnection(
    ctx: CanvasRenderingContext2D,
    sourceElement: joint.dia.Element,
    targetElement: joint.dia.Element,
    type: string = 'association'
  ) {
    const source = this.elementToConnectionFormat(sourceElement);
    const target = this.elementToConnectionFormat(targetElement);
    
    const connection = ConnectionFactory.create(type, source, target);
    connection.render(ctx);
  }
}
