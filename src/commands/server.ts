import {Command, flags} from '@oclif/command'
import {generateServer, GeneratorError, tsConfigExists} from '../gen'
import {isValidServerFrameworkOption, ServerFrameworkOption} from '../gen/server'
import {writeOutput} from '../gen/util'

export default class Server extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    tsConfig: flags.string({char: 't', name: 'tsconfig', description: 'path to tsconfig.json for schema project'}),
    output: flags.string({char: 'o', name: 'output', description: 'path to output directory for generated files'}),
    framework: flags.string({char: 'f', name: 'framework', description: 'which framework to use for generating the server code. Option are express | koa | fastify'}),

  }

  async run(): Promise<void> {
    const {flags} = this.parse(Server)

    const tsConfig = flags.tsConfig ?? ''
    const outputPath = flags.output ?? ''
    const serverFramework = flags.framework ?? ''
    await this.validateTsConfigFile(tsConfig)
    this.validateServerFramework(serverFramework)
    this.validateOutputPath(outputPath)
    const code = await generateServer(tsConfig, serverFramework as ServerFrameworkOption)
    if (code instanceof GeneratorError) {
      throw code
    }
    this.log(`generating server code using ${serverFramework}`)
    try {
      await writeOutput(outputPath, code, 'server')
      this.log(`server code generation complete, please check ${outputPath} for your files `)
    } catch (error) {
      this.log(`error occurred: ${error}`)
      throw error
    }
  }

  private async validateTsConfigFile(tsConfigFile: string): Promise<void> {
    const exists = await tsConfigExists(tsConfigFile)
    if (tsConfigFile === '' || !exists) {
      this.log('error: please provide a path to a valid tsconfig.json file')
      throw new Error('tsconfig.json is invalid or does not exist')
    }
  }

  private validateServerFramework(framework: string): void {
    if (!isValidServerFrameworkOption(framework)) {
      this.log(`sorry ${framework} is not a valid server framework option or has not yet been implemented`)
      throw new Error('bad server framework option')
    }
  }

  private validateOutputPath(outputPath: string): void {
    if (outputPath === '') {
      this.log('please provide a directory path to write generated output')
      throw new Error('no output path provided')
    }
  }
}
