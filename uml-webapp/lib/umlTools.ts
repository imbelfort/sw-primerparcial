import * as joint from "jointjs";

export type NodeToolKind = "uml-class" | "uml-interface" | "uml-abstract";
export type LinkToolKind = "assoc" | "generalization";

export function createUmlNode(kind: NodeToolKind, graph: joint.dia.Graph, x: number, y: number) {
  const umlNs: any = (joint.shapes as any).uml;
  try {
    if (umlNs) {
      if (kind === "uml-class") {
        const el = new umlNs.Class({
          position: { x: x - 80, y: y - 30 },
          size: { width: 160, height: 60 },
          name: "Class",
          attributes: [],
          methods: [],
        });
        el.addTo(graph);
        return;
      }
      if (kind === "uml-interface") {
        const el = new umlNs.Interface({
          position: { x: x - 80, y: y - 30 },
          size: { width: 160, height: 60 },
          name: "Interface",
          attributes: [],
          methods: [],
        });
        el.addTo(graph);
        return;
      }
      if (kind === "uml-abstract") {
        const el = new umlNs.Abstract({
          position: { x: x - 80, y: y - 30 },
          size: { width: 160, height: 60 },
          name: "AbstractClass",
          attributes: [],
          methods: [],
        });
        el.addTo(graph);
        return;
      }
    }
    // Fallback rectangle
    const rect = new (joint.shapes as any).standard.Rectangle();
    rect.position(x - 80, y - 30);
    rect.resize(160, 60);
    rect.attr({ body: { fill: "#fff" }, label: { text: kind.replace("uml-", "") } });
    rect.addTo(graph);
  } catch (e) {
    console.error("createUmlNode error", e);
  }
}

export function createUmlLink(
  kind: LinkToolKind,
  graph: joint.dia.Graph,
  sourceId: string,
  targetId: string
) {
  if (sourceId === targetId) return;
  const umlNs: any = (joint.shapes as any).uml;
  try {
    let link: any;
    if (umlNs) {
      if (kind === "assoc") {
        link = new umlNs.Association({ source: { id: sourceId }, target: { id: targetId } });
      } else if (kind === "generalization") {
        link = new umlNs.Generalization({ source: { id: sourceId }, target: { id: targetId } });
      }
    }
    if (!link) {
      link = new joint.dia.Link({
        source: { id: sourceId },
        target: { id: targetId },
        attrs: {
          line: {
            stroke: "#111827",
            targetMarker:
              kind === "generalization"
                ? { type: "path", d: "M 20 0 L 0 10 L 20 20 z", fill: "#fff", stroke: "#111827" }
                : { type: "path", d: "M 10 -5 0 0 10 5 z", fill: "#111827" },
          },
        },
      });
    }
    link.addTo(graph);
  } catch (e) {
    console.error("createUmlLink error", e);
  }
}

export type BasicClassData = {
  id: string;
  kind: "uml-class" | "uml-interface" | "uml-abstract" | "standard";
  name?: string;
  attributes?: string[];
  methods?: string[];
};

export function getClassDataFromCell(cell: any): BasicClassData | null {
  if (!cell) return null;
  const type = cell.get?.("type");
  const id = cell.id as string;
  if (!id) return null;
  if (typeof type === "string" && type.startsWith("uml.")) {
    let kind: BasicClassData["kind"] = "uml-class";
    if (type === "uml.Interface") kind = "uml-interface";
    else if (type === "uml.Abstract") kind = "uml-abstract";
    return {
      id,
      kind,
      name: cell.get("name"),
      attributes: cell.get("attributes") || [],
      methods: cell.get("methods") || [],
    };
  }
  // Fallback for standard rectangle
  const label = cell.attr?.("label/text");
  return { id, kind: "standard", name: label };
}

export function applyClassDataToCell(cell: any, data: Partial<BasicClassData>) {
  if (!cell || !data) return;
  const type = cell.get?.("type");
  const isUml = typeof type === "string" && type.startsWith("uml.");
  if (isUml) {
    if (data.name !== undefined) cell.set("name", data.name);
    if (data.attributes !== undefined) cell.set("attributes", data.attributes);
    if (data.methods !== undefined) cell.set("methods", data.methods);
  } else {
    if (data.name !== undefined) cell.attr("label/text", data.name);
  }
}
