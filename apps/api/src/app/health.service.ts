import { Injectable } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { graphql } from 'graphql';
import { DataSource } from 'typeorm';

export type DependencyStatus = 'up' | 'down';

export interface HealthReport {
  status: 'ok' | 'error';
  database: DependencyStatus;
  graphql: DependencyStatus;
  websocket: DependencyStatus;
}

interface HttpServerWithListeners {
  listeners(event: string): readonly unknown[];
}

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly schemaHost: GraphQLSchemaHost,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  async check(): Promise<HealthReport> {
    const [database, graphqlStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkGraphql(),
    ]);
    const websocket = this.checkWebsocket();
    const status =
      database === 'up' && graphqlStatus === 'up' && websocket === 'up' ? 'ok' : 'error';

    return { status, database, graphql: graphqlStatus, websocket };
  }

  private async checkDatabase(): Promise<DependencyStatus> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async checkGraphql(): Promise<DependencyStatus> {
    try {
      const result = await graphql({
        schema: this.schemaHost.schema,
        source: '{ health }',
      });
      const health: unknown = result.data?.['health'];
      return result.errors === undefined && health === 'API is running' ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }

  private checkWebsocket(): DependencyStatus {
    try {
      const server = this.httpAdapterHost.httpAdapter.getHttpServer() as
        | HttpServerWithListeners
        | undefined;
      const listeners = server?.listeners('upgrade') ?? [];
      return listeners.length > 0 ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }
}
