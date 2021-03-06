/*
 * Copyright (c) 2020. Gary Becks - <techstar.dev@hotmail.com>
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import yargs, { CommandModule } from 'yargs'
import { scaffold } from './utils'

type Args = Readonly<
    Partial<{
        name: string
        client: string
        server: string
        yarn: boolean
    }>
>

const handler = async (args: Args): Promise<void> => {
    const { name, client, server, yarn } = args
    if (!name) {
        throw new Error(`name must be provided when using the create command`)
    }
    await scaffold(name, yarn, client, server)
}
export const create: CommandModule<Record<string, unknown>, Args> = {
    command: 'create <name>',
    describe: 'creates a new typerpc application',
    builder: (_) => {
        return yargs
            .positional('name', {
                alias: 'n',
                type: 'string',
                demandOption: true,
                description: 'name of the project to create',
            })
            .options({
                client: {
                    alias: 'c',
                    type: 'string',
                    description: 'name of the plugin to use for client side code generation',
                },
                server: {
                    alias: 's',
                    type: 'string',
                    description: 'name of the plugin to use for server side code generation',
                },
                yarn: {
                    alias: 'y',
                    type: 'boolean',
                    description: 'use yarn to install packages instead of npm',
                },
            })
    },
    handler,
}
