import { Code, TypeRpcPlugin } from '@typerpc/plugin'
import { Param, QueryService, Schema, MutationService, QueryMethod } from '@typerpc/schema'
import { buildFileName, buildInterfaces, buildTypes, format } from '@typerpc/go-plugin-utils'
import { capitalize, lowerCase } from '@typerpc/plugin-utils'

const parseUrlParams = (params: ReadonlyArray<Param>): string => {
    let parsed = `q := req.URL.Query()
  `
    for (const param of params) {
        parsed = parsed.concat(`${param.name} := q.Get("${param.name}")
    `)
    }
    return parsed
}

const buildGetHandler = (method: QueryMethod) => {
    return `
   r.Get("/${method.name}", func(res http.ResponseWriter, req *http.Request) {
    ${parseUrlParams(method.params)}
	})`
}

const buildRoutes = (svc: QueryService | MutationService): string => {
    return `
func ${capitalize(svc.name)}Routes(${lowerCase(svc.name)} ${capitalize(
        svc.name,
    )}, middlewares ...func(handler http.Handler) http.Handler) chi.Router {
    r := chi.NewRouter()
    for _, x := range middlewares {
      r.Use(x)
    }

    return r
}
`
}

const buildFile = (schema: Schema): Code => {
    return {
        fileName: buildFileName(schema.fileName),
        source: `
package ${schema.packageName}

import (
	"context"
	"time"
)

${buildTypes(schema.messages)}
${buildInterfaces(schema)}
`,
    }
}
const build = (schemas: Schema[]): Code[] => schemas.map((schema) => buildFile(schema))
export const FiberBuilder: TypeRpcPlugin = {
    build,
    format,
    framework: 'chi',
    lang: 'go',
    target: 'server',
}
