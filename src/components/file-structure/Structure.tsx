import React, { useRef, forwardRef, PropsWithRef } from "react";
import "../../styles/structure.css";
import parse from "html-react-parser";
import structureData from "./structureData";
import { fileStructureClickHandler, mapObjectRecursively } from "./StructureUtils";

const Structure = forwardRef<any>((props, fileSysRef) => {
  // const fileSysRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="file-sys-container custom-scrollbar"
      ref={fileSysRef}
      onClick={(e) => fileStructureClickHandler(e, fileSysRef)}
    >
      {parse(mapObjectRecursively(structureData))}
    </div>
  );
});

export default Structure;
