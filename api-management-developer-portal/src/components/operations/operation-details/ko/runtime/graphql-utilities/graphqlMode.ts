/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import type { IDisposable, Uri, languages } from "monaco-editor";
import { WorkerManager } from "./workerManager";
import { GraphQLWorker } from "./graphqlWorker";

// @ts-ignore
import { language as monarchLanguage } from "monaco-editor/esm/vs/basic-languages/graphql/graphql";

import { LanguageServiceApi } from "./languageServiceApi";
import * as languageFeatures from "./languageFeatures";

export function setupMode(defaults: LanguageServiceApi): IDisposable {
    const disposables: IDisposable[] = [];
    const providers: IDisposable[] = [];
    const client = new WorkerManager(defaults);
    const { languageId } = defaults;

    disposables.push(client);

    const worker: languageFeatures.WorkerAccessor = async (...uris: Uri[]): Promise<GraphQLWorker> => {
        try {
            return await client.getLanguageServiceWorker();
        }
        catch (err) {
            throw Error("Error fetching graphql language service worker");
        }
    };

    // defaults.setWorker(worker);

    const monacoInstance = (<any>window).monaco;

    monacoInstance.languages.setLanguageConfiguration(languageId, richLanguageConfig);
    monacoInstance.languages.setMonarchTokensProvider(languageId, monarchLanguage);

    function registerFormattingProvider(): void {
        const { modeConfiguration } = defaults;

        if (modeConfiguration.documentFormattingEdits) {
            providers.push(
                monacoInstance.languages.registerDocumentFormattingEditProvider(
                    defaults.languageId,
                    new languageFeatures.DocumentFormattingAdapter(worker),
                ),
            );
        }
    }

    function registerProviders(): void {
        const { modeConfiguration } = defaults;
        disposeAll(providers);

        if (modeConfiguration.completionItems) {
            providers.push(
                monacoInstance.languages.registerCompletionItemProvider(
                    defaults.languageId,
                    new languageFeatures.CompletionAdapter(worker),
                ),
            );
        }

        if (modeConfiguration.diagnostics) {
            providers.push(new languageFeatures.DiagnosticsAdapter(worker, defaults));
        }

        if (modeConfiguration.hovers) {
            providers.push(
                monacoInstance.languages.registerHoverProvider(
                    defaults.languageId,
                    new languageFeatures.HoverAdapter(worker),
                ),
            );
        }

        registerFormattingProvider();
    }

    registerProviders();

    let { modeConfiguration, schemaConfig, formattingOptions } = defaults;

    defaults.onDidChange(newDefaults => {
        if (defaults.schemaString !== newDefaults.schemaString) {
            registerProviders();
        }
        if (newDefaults.modeConfiguration !== modeConfiguration) {
            modeConfiguration = newDefaults.modeConfiguration;
            registerProviders();
        }
        if (newDefaults.schemaConfig !== schemaConfig) {
            schemaConfig = newDefaults.schemaConfig;
            registerProviders();
        }
        if (newDefaults.formattingOptions !== formattingOptions) {
            formattingOptions = newDefaults.formattingOptions;
            registerFormattingProvider();
        }
    });
    disposables.push(asDisposable(providers));

    return asDisposable(disposables);
}

function asDisposable(disposables: IDisposable[]): IDisposable {
    return { dispose: () => disposeAll(disposables) };
}

function disposeAll(disposables: IDisposable[]) {
    while (disposables.length) {
        disposables.pop()?.dispose();
    }
}

export const richLanguageConfig: languages.LanguageConfiguration = {
    comments: {
        lineComment: "#",
    },
    brackets: [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"],
    ],
    autoClosingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: "\"\"\"", close: "\"\"\"", notIn: ["string", "comment"] },
        { open: "\"", close: "\"", notIn: ["string", "comment"] },
    ],
    surroundingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: "\"\"\"", close: "\"\"\"" },
        { open: "\"", close: "\"" },
    ],
    folding: {
        offSide: true,
    }
};
