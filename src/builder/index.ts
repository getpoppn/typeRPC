import {AxiosBuilder} from './client'
import {Code, Target} from './builder'
import {FastifyGenerator} from './server'

export {Code, Target}

export const isTarget = (target: string): target is Target => {
  return ['client', 'server'].includes(target)
}
/**
 * An error that occurs either creating a creating Generator or from the result of a Generator attempting to generate code
 *
 * @export
 * @class GeneratorError
 */
export class BuilderError extends Error {
  // eslint-disable-next-line no-useless-constructor
  constructor(public readonly errorMessage: string) {
    super(errorMessage)
  }
}

export const buildTypes = (target: Target, tsConfigFilePath: string, outputPath: string, jobId: string) => {
  const generator = target === 'client' ? new AxiosBuilder(target, tsConfigFilePath, outputPath, jobId) : new FastifyGenerator(target, tsConfigFilePath, outputPath, jobId)
  return generator.buildTypes()
}

export const generateCode = (target: Target, tsConfigFilePath: string, outputPath: string, jobId: string): Code => {
  const generator = target === 'client' ? new AxiosBuilder(target, tsConfigFilePath, outputPath, jobId) : new FastifyGenerator(target, tsConfigFilePath, outputPath, jobId)
  return generator.buildRpc()
}

