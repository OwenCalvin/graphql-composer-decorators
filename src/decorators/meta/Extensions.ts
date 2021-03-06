import { KeyValue } from "graphql-composer";
import { MetadataStorage } from "../..";

export function Extensions<ExtensionsType = KeyValue>(
  extensions: ExtensionsType,
) {
  return (
    prototype: Function | Object,
    propertyKey?,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    const fieldModifier = (f) =>
      f.setExtensions({
        ...f.extensions,
        ...extensions,
      });

    if (typeof prototype === "function") {
      MetadataStorage.instance.addTypeModifier({
        classType: prototype,
        key: prototype.name,
        fieldModifier,
        modifier: (t) =>
          t.setExtensions({
            ...t.extensions,
            ...extensions,
          }),
      });
    } else {
      MetadataStorage.instance.addFieldModifier({
        classType: prototype.constructor,
        key: propertyKey,
        modifier: fieldModifier,
      });
    }
  };
}
