import { Inject, Injectable, Optional } from '@nestjs/common';
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
    private readonly httpAdapterHost: HttpAdapterHost,
    @Optional() @Inject(GraphQLSchemaHost) private readonly schemaHost: GraphQLSchemaHost | null,
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
      const schema = this.schemaHost?.schema;
      if (schema) {
        const result = await graphql({
          schema,
          source: '{ health }',
        });
        const health: unknown = result.data?.['health'];
        if (result.errors === undefined && health === 'API is running') {
          return 'up';
        }
      }

      // Docker/webpack: GraphQLSchemaHost can be empty while /graphql already serves
      return await this.probeGraphqlOverHttp();
    } catch {
      return 'down';
    }
  }

  private async probeGraphqlOverHttp(): Promise<DependencyStatus> {
    try {
      const port = process.env['PORT'] ?? '3001';
      const response = await fetch(`http://127.0.0.1:${port}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ health }' }),
      });
      if (!response.ok) {
        return 'down';
      }
      const body = (await response.json()) as {
        data?: { health?: unknown };
        errors?: unknown;
      };
      return body.errors === undefined && body.data?.health === 'API is running' ? 'up' : 'down';
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
