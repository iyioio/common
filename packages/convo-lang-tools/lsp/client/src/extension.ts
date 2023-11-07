/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import * as path from 'path';
import { ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

let client:LanguageClient;

export function activate(context:ExtensionContext){

	const serverModule=context.asAbsolutePath(
		path.join('lsp','server','out','server.js')
	);

	const serverOptions:ServerOptions={
		run:{module:serverModule,transport:TransportKind.ipc},
		debug:{
			module:serverModule,
			transport:TransportKind.ipc,
		}
	};

	const clientOptions:LanguageClientOptions={
		documentSelector:[{scheme:'file',language:'source.convo'}],
	};

	client=new LanguageClient(
		'convoLanguageServer',
		'Convo Language Server',
		serverOptions,
		clientOptions
	);

	client.start();
}

export function deactivate():Thenable<void>|undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
