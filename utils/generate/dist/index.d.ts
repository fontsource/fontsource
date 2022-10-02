interface Axes {
    min: number;
    max: number;
}
interface Source {
    url: string;
    format: string;
}
interface Variable {
    wght?: number[];
    stretch?: Axes;
    slnt?: Axes;
}
interface FontObject {
    family: string;
    style: string;
    weight: number;
    src: Source[];
    variable?: Variable;
    unicodeRange?: string;
    comment?: string;
    spacer?: string;
}
interface UnicodeRange {
    [subset: string]: string;
}
interface FontMetadata {
    family: string;
    id?: string;
    styles: string[];
    weights: number[];
    formats: string[];
    subsets: string[];
    variable?: Variable;
    path?: string;
    unicodeRange?: UnicodeRange;
}

declare const generateSingle: (font: FontObject) => string;
declare const generateMulti: (metadata: FontMetadata) => string;

export { generateMulti, generateSingle };
