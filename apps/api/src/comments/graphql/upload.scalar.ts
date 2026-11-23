import { Scalar } from '@nestjs/graphql';
import { ValueNode } from 'graphql';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';

@Scalar('Upload')
export class UploadScalar {
  description = 'File upload';

  parseValue(value: unknown) {
    return GraphQLUpload.parseValue(value);
  }

  serialize(value: unknown) {
    return GraphQLUpload.serialize(value);
  }

  parseLiteral(ast: ValueNode) {
    return GraphQLUpload.parseLiteral(ast);
  }
}
