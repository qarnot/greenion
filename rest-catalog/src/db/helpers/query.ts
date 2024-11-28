import type { IncludeOptions, FindOptions } from 'sequelize';
import { singularize } from 'inflection';

import type { EnrichedTransaction } from '@db/lib/sequelize';
import type { Associations, Models } from '../data';

import { associations, models } from '../data';

type QueryOptions<NestedAssociations> = {
  includes?: NestedAssociations[];
  transaction: EnrichedTransaction;
  paranoid?: boolean;
};

type Includes = { [nestedAssociation: string]: Models[keyof Models] | IncludeOptions };

function getNestedAssociationsFor(modelName: keyof Models): Includes {
  if (!associations[modelName]) return {};
  return Object.entries(associations[modelName]).reduce(
    (prevObj, [associatedModelName, association]) => {
      const associationModel = models[modelName];
      return {
        ...prevObj,
        [`${modelName}.${associatedModelName}`]: {
          model: associationModel,
          include: [association],
        },
      };
    },
    {}
  );
}

function getAllAssociationsFor(associationModelName: keyof Associations): Includes {
  let modelAssociations: Includes = {};

  Object.values(associations[associationModelName]).forEach(association => {
    let { tableName } = association;
    if (!tableName) {
      const table = association.getTableName();
      tableName = typeof table === 'string' ? table : table.tableName;
    }

    // by default sequelize is using singular for model's name and plural for table's name
    // for details see: https://sequelize.org/docs/v6/other-topics/naming-strategies/#singular-vs-plural
    // remove it to ease manipulation of nested association
    // ex: use `profile.constant` instead of `profiles.constants`
    const associatedModelName = singularize(tableName) as keyof Models;

    const nestedAssociations = getNestedAssociationsFor(associatedModelName);
    modelAssociations = {
      ...modelAssociations,
      [associatedModelName]: association,
      ...nestedAssociations,
    };
  });

  return modelAssociations;
}

function getIncludeOptions<NestedAssociations>(
  allAssociations: Includes,
  defaultIncludes: NestedAssociations[],
  includes: NestedAssociations[] = []
): {
  include?: FindOptions['include'];
} {
  const include = (includes || defaultIncludes)
    .map(associationName => {
      // re-cast associationName to convert from string litteral to generic string type
      // (to match allAssociations <=> Includes index)
      const name = associationName as unknown as string;
      return allAssociations[name];
    })
    .filter(inclusion => !!inclusion); // filter out empty values
  return include.length > 0 ? { include } : {};
}

function cleanWhereParams<CreationAttributes>(
  params: Partial<CreationAttributes>,
  attributeNames: (keyof Partial<CreationAttributes>)[]
): Partial<CreationAttributes> {
  const cleanedParams: Partial<CreationAttributes> = { ...params };
  attributeNames.forEach(attributeName => {
    if (cleanedParams[attributeName] === undefined) delete cleanedParams[attributeName];
  });
  return cleanedParams;
}

export type { QueryOptions, Includes };
export { getAllAssociationsFor, getIncludeOptions, cleanWhereParams };
