jest.mock('graphql-upload/GraphQLUpload.mjs', () => ({
  __esModule: true,
  default: {
    parseValue: jest.fn((value: unknown) => value),
    serialize: jest.fn((value: unknown) => value),
    parseLiteral: jest.fn((ast: unknown) => ast),
  },
}));

import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import { Kind, type ValueNode } from 'graphql';

import { UploadScalar } from './upload.scalar';

describe('UploadScalar', () => {
  const scalar = new UploadScalar();

  it('delegates parseValue to GraphQLUpload', () => {
    const value = Promise.resolve({ filename: 'a.png' });
    expect(scalar.parseValue(value)).toBe(value);
    expect(GraphQLUpload.parseValue).toHaveBeenCalledWith(value);
  });

  it('delegates serialize to GraphQLUpload', () => {
    expect(scalar.serialize('x')).toBe('x');
    expect(GraphQLUpload.serialize).toHaveBeenCalledWith('x');
  });

  it('delegates parseLiteral to GraphQLUpload', () => {
    const ast = { kind: Kind.STRING, value: 'x' } as ValueNode;
    expect(scalar.parseLiteral(ast)).toBe(ast);
    expect(GraphQLUpload.parseLiteral).toHaveBeenCalledWith(ast);
  });
});
