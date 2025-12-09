import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tolk',
    entrypoint: 'chainlink-ton/contracts/contracts/ccip/test/receiver/contract.tolk',
    withStackComments: true,
};

