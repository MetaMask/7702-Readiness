import { useState } from "react"
import { useSyncProviders } from "../hooks/useSyncProviders"
import { BATCH_TXN_5792, formatChainAsNum } from "../utils"
import { ethers } from "ethers";

export const DiscoverWalletProviders = () => {
    const [provider, setProvider] = useState<EIP1193Provider>()
    const [userAccount, setUserAccount] = useState<string>("")
    const [chainId, setChainId] = useState<string>("")
    const [chainName, setChainName] = useState<string>("")
    const [refresh, setRefresh] = useState<boolean>(false)
    const [capabilities, setCapabilities] = useState<string[]>([])
    const [isSmartEoa, setIsSmartEoa] = useState<boolean>(false)
    const [supportAtomic, setSupportAtomic] = useState<boolean>(false)
    const [isConnectDisabled, setConnectDisabled] = useState<boolean>(false)
    const [processingTxn, setProcessingTxn] = useState<boolean>(false)
    const [connectStatus, setConnectStatus] = useState<string>("Connect Wallet")
    const [add1, setAdd1] = useState<string>();
    const [add2, setAdd2] = useState<string>();
    const [val1, setVal1] = useState<string>();
    const [val2, setVal2] = useState<string>();

    const providers = useSyncProviders()
    const mmProvider = providers.find(p => p.info.name == "MetaMask");

    // Connect to the selected provider using eth_requestAccounts.
    const handleConnect = async (providerWithInfo: EIP6963ProviderDetail) => {
        setConnectDisabled(true);
        try {
            const accounts = await providerWithInfo.provider.request({
                method: "eth_requestAccounts"
            }) as string[]

            await updateStuff(providerWithInfo.provider, accounts[0]);

            setAdd1("0xdC659bF818f5Bc99DC672C746850e2BEBbA7D87d");
            setAdd2("0x72DAcE9babA0561934a00F012ea2Df5082cd9052");
            setVal1("0");
            setVal2("0");
            setConnectStatus("Wallet Connected");

            (providerWithInfo.provider as any).on("accountsChanged", handleAccountChanged);
            (providerWithInfo.provider as any).on("chainChanged", handleChainChanged);
        } catch (error) {
            console.error(error)
            setConnectDisabled(false);
        }
    }

    // Disconnect from the selected provider.
    const handleDisconnect = async () => {
        try {
            await provider?.request({
                method: "wallet_revokePermissions",
                params: [
                    {
                        eth_accounts: {},
                    },
                ],
            }) as string[]

            setConnectDisabled(false);
            setProvider(undefined);
            setUserAccount("");
            setChainId("");
            setChainName("");
            setCapabilities([]);
            setConnectStatus("Connect Wallet");
        } catch (error) {
            console.error(error)
        }
    }

    const handleChainChanged = async (newChainId: string) => {
        setRefresh(true);
        setChainId(newChainId);
    }

    const handleAccountChanged = async (newAccounts: string[]) => {
        setRefresh(true);
        setUserAccount(newAccounts[0]);
    }

    const handleRefresh = async () => {
        setRefresh(false);
        await updateStuff(provider as EIP1193Provider, userAccount);
    }

    const handleSendCalls = async () => {
        try {
            const res = await provider?.request({
                method: 'wallet_sendCalls',
                params: [{
                    version: '2.0.0',
                    chainId: chainId,
                    from: userAccount,
                    atomicRequired: true,
                    calls: [
                        {
                            to: add1,
                            value: `0x${val1}`,
                        },
                        {
                            to: add2,
                            value: `0x${val2}`,
                        }
                    ],
                }]
            }) as any;

            console.log("SendCalls Res", res);
            setProcessingTxn(true);

            const int = setInterval(async () => {
                const status = await mmProvider?.provider.request({
                    method: 'wallet_getCallsStatus',
                    params: [res.id]
                }) as any;
                if (status.status == 200) {
                    const ethersProvider = new ethers.BrowserProvider(mmProvider?.provider as EIP1193Provider);
                    const eoaCode = await ethersProvider.getCode(userAccount);
                    setIsSmartEoa(eoaCode != "0x");
                    clearInterval(int);
                    setProcessingTxn(false);
                }
            }, 1000);
        }
        catch (error) {
            console.error(error)
        }
    }

    const handleAddressChange = (num: number, e: any) => {
        if (num == 1)
            setAdd1(e.target.value);
        else
            setAdd2(e.target.value);
    }

    const handleValueChange = (num: number, e: any) => {
        if (num == 1)
            setVal1(e.target.value);
        else
            setVal2(e.target.value);
    }

    const updateStuff = async (eipProvider: EIP1193Provider, account: string) => {
        const currProvider = eipProvider || provider as EIP1193Provider;
        const currAccount = account;
        const ethersProvider = new ethers.BrowserProvider(currProvider);
        const network = await ethersProvider.getNetwork()
        const currChainId = await currProvider.request({ method: "eth_chainId" }) as string;
        const currChainName = network.name;
        const currCapabilities = await currProvider.request({
            method: 'wallet_getCapabilities',
            params: [currAccount, [currChainId]]
        }) as any;
        const eoaCode = await ethersProvider.getCode(currAccount);

        setProvider(currProvider);
        setUserAccount(currAccount);
        setChainId(currChainId);
        setChainName(currChainName);
        setIsSmartEoa(eoaCode != "0x");
        if (currCapabilities[currChainId]) {
            const keys = Object.keys(currCapabilities[currChainId]);
            setCapabilities(keys);
            setSupportAtomic(keys.includes(BATCH_TXN_5792))
        } else {
            setCapabilities(['None']);
            setSupportAtomic(false)
        }
    }

    // Display detected providers as connect buttons.
    return (
        <>
            {mmProvider ?
                <div>
                    <div>
                        <svg viewBox="0 0 221 110" fill="none" xmlns="http://www.w3.org/2000/svg" width="150px" height="150px">
                            <path
                                d="M125.411 84.3652V108.255H113.074V91.7037L99.015 93.3384C95.927 93.6945 94.5683 94.7044 94.5683 96.5644C94.5683 99.2891 97.1477 100.437 102.677 100.437C106.048 100.437 109.783 99.9357 113.081 99.0711L106.695 108.11C104.116 108.684 101.602 108.967 98.9496 108.967C87.7603 108.967 81.3737 104.52 81.3737 96.6298C81.3737 89.6692 86.3944 86.0146 97.8016 84.7213L112.871 82.9702C112.057 78.589 108.751 76.6854 102.176 76.6854C96.007 76.6854 89.1917 78.262 83.0957 81.2046L85.0357 70.5167C90.7029 68.1481 97.1622 66.9275 103.687 66.9275C118.037 66.9275 125.426 72.8854 125.426 84.358L125.411 84.3652ZM14.4271 54.4522L0.941895 108.255H14.4271L21.1189 81.2192L32.7223 95.1258H46.7815L58.3849 81.2192L65.0767 108.255H78.5619L65.0767 54.4449L39.7483 84.5251L14.4199 54.4449L14.4271 54.4522ZM65.0767 0.642029L39.7483 30.7222L14.4271 0.642029L0.941895 54.4522H14.4271L21.1189 27.4163L32.7223 41.323H46.7815L58.3849 27.4163L65.0767 54.4522H78.5619L65.0767 0.642029ZM157.838 83.8639L146.933 82.2872C144.208 81.8586 143.133 80.9939 143.133 79.4899C143.133 77.0486 145.785 75.9733 151.241 75.9733C157.555 75.9733 163.222 77.2666 169.18 80.0639L167.676 69.5213C162.866 67.7993 157.344 66.942 151.604 66.942C138.192 66.942 130.868 71.6066 130.868 79.9985C130.868 86.5304 134.886 90.1851 143.423 91.4784L154.474 93.1277C157.272 93.5564 158.42 94.6317 158.42 96.3537C158.42 98.795 155.84 99.943 150.602 99.943C143.714 99.943 136.252 98.2937 130.156 95.3511L131.377 105.894C136.615 107.834 143.43 108.982 149.817 108.982C163.593 108.982 170.764 104.172 170.764 95.6344C170.764 88.8192 166.746 85.1572 157.853 83.8712L157.838 83.8639ZM175.56 59.2548V108.255H187.897V59.2548H175.56ZM202.312 86.2325L219.467 67.6468H204.114L187.897 86.8719L205.189 108.248H220.76L202.312 86.2253V86.2325ZM173.838 42.827C173.838 50.7176 180.224 55.1642 191.413 55.1642C194.065 55.1642 196.579 54.8736 199.159 54.3068L205.545 45.2683C202.247 46.1256 198.512 46.6342 195.141 46.6342C189.619 46.6342 187.032 45.4862 187.032 42.7616C187.032 40.8943 188.398 39.8916 191.479 39.5356L205.538 37.9008V54.4522H217.875V30.5624C217.875 19.0825 210.486 13.1319 196.136 13.1319C189.604 13.1319 183.152 14.3525 177.485 16.7211L175.545 27.409C181.641 24.4664 188.456 22.8898 194.625 22.8898C201.2 22.8898 204.506 24.7934 205.32 29.1746L190.251 30.9257C178.844 32.219 173.823 35.8736 173.823 42.8342L173.838 42.827ZM139.333 40.2476C139.333 50.1508 145.073 55.1715 156.407 55.1715C160.926 55.1715 164.661 54.4522 168.243 52.8028L169.82 41.9696C166.376 44.0476 162.859 45.1229 159.342 45.1229C154.031 45.1229 151.663 42.9723 151.663 38.1624V23.8125H170.386V13.8439H151.663V5.3793L128.201 17.7892V23.8125H139.318V40.2404L139.333 40.2476ZM127.206 35.7283V38.1696H93.8635C95.3676 43.1394 99.836 45.4136 107.77 45.4136C114.084 45.4136 119.969 44.1203 125.201 41.6136L123.697 52.0908C118.887 54.0961 112.791 55.1787 106.55 55.1787C89.9764 55.1787 80.9378 47.8621 80.9378 34.3042C80.9378 20.7464 90.1217 13.1391 104.326 13.1391C118.531 13.1391 127.213 21.393 127.213 35.7356L127.206 35.7283ZM93.7037 29.8431H114.789C113.677 25.084 110.023 22.5991 104.181 22.5991C98.3392 22.5991 94.8735 25.0186 93.7037 29.8431Z"
                                fill="black" />
                        </svg>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 142 137" width="150px" height="150px">
                        <path fill="#0A0A0A" d="m131.215 130.727-29.976-8.883-22.604 13.449H62.861l-22.619-13.449-29.96 8.883-9.11-30.63 9.117-33.992-9.117-28.742 9.11-35.618 46.817 27.847h27.298l46.818-27.847 9.117 35.618-9.117 28.742 9.117 33.992-9.117 30.63Z" />
                        <path fill="#89B0FF" d="m138.828 101.219-8.364 28.103-28.088-8.335-2.257-.669-3.219-.956-13.78-4.092-1.204.158-.466 1.7 17.015 5.048-20.145 11.99H63.193l-20.144-11.99 17.008-5.04-.467-1.708-1.196-.158-17.007 5.048-2.257.669-28.08 8.335-8.365-28.103L0 100.121l9.53 32.006 30.57-9.079 22.469 13.374h16.376l22.468-13.374 30.57 9.079 9.523-32.006-2.678 1.098Z" />
                        <path fill="#D075FF" d="M39.13 101.218v19.768l2.257-.669v-17.948l17.007 12.9 1.196.158 1.113-1.241-20.076-15.225H2.647l8.508-31.728-2.038-1.106L0 100.12l2.685 1.098H39.13Zm70.128-17.827-7.221 1.783v2.332l10.636-2.633.068-17.64h-1.497l-.76-.518-.06 14.66-8.718-8.229H83.615l-.346 2.264h17.542l8.447 7.981Z" />
                        <path fill="#D075FF" d="M39.475 87.506v-2.332l-7.222-1.783 8.448-7.98h17.534l-.346-2.265H40.242l-.775.309-8.38 7.92-.06-14.66-.76.519h-1.504l.068 17.64 10.644 2.632Zm90.877-20.273 8.508 31.728h-37.979l-20.077 15.225 1.114 1.241 1.203-.158 17-12.9v17.948l2.257.669v-19.768h36.452l2.678-1.098-9.11-33.993-2.046 1.106Z" />
                        <path fill="#FF5C16" d="M28.765 67.233h1.504l.76-.52 23.386-16.021 3.483 22.46.346 2.265 5.491 35.422 1.956-.79h.203l-9.508-61.35 1.752-17.971h25.237L85.12 48.72l-9.508 61.328h.204l1.955.79 5.491-35.422.346-2.264h.008l3.483-22.461 23.378 16.022.76.526h19.114l2.038-1.105 9.11-28.735L131.938 0 84.12 28.464H57.394L9.568 0 0 37.4l9.11 28.735 2.038 1.105h17.61l.007-.007Zm110.394-29.9-8.77 27.643h-18.422l-23.973-16.42 42.635-44.562 8.53 33.338ZM124.672 6.957 87.152 46.17l-1.558-15.955 39.078-23.258Zm-68.76 23.25-1.55 15.963-37.52-39.22 39.07 23.25v.008ZM2.347 37.333l8.53-33.338 42.635 44.561-23.972 16.42H11.118L2.347 37.332Z" />
                        <path fill="#BAF24A" d="M77.07 110.049H64.442l-4.852 5.379 2.415 8.808h17.489l2.415-8.808-4.852-5.379h.015Zm.7 11.93H63.75l-1.64-5.972 3.317-3.679h10.666l3.317 3.679-1.64 5.972ZM58.26 90.807l-.211-.55v-.014l-3.739-9.689H44.2l-4.723 4.619v2.324l16.676 4.122 2.106-.812Zm-13.142-7.989h7.643l2.4 6.214-13.104-3.235 3.054-2.978h.007Zm40.228 8.802 16.677-4.121v-2.325l-4.724-4.61h-10.11l-3.738 9.68v.015l-.211.55 2.106.812Zm14.09-5.822-13.104 3.235 2.4-6.22h7.642l3.054 2.986h.007Z" />
                    </svg>
                    <h2>7702/5792 Readiness</h2>
                    <hr />
                    <div>
                        {
                            <button key={mmProvider.info.uuid} disabled={isConnectDisabled} onClick={() => handleConnect(mmProvider)} >
                                <img src={mmProvider.info.icon} alt={mmProvider.info.name} />
                                <div>{connectStatus}</div>
                            </button>
                        }
                    </div>
                    <hr />
                    {refresh &&
                        <div>
                            <button onClick={() => handleRefresh()} >
                                Refresh
                            </button>
                        </div>
                    }
                    {userAccount && !refresh &&
                        <div>
                            <div>
                                <table>
                                    <tbody>
                                        <tr>
                                            <td className="hdrCol">Account</td>
                                            <td className="dtlCol">{userAccount}</td>
                                        </tr>
                                        <tr>
                                            <td className="hdrCol">Is Smart Account</td>
                                            <td className="dtlCol">{isSmartEoa ? "Yes" : "No"}</td>
                                        </tr>
                                        <tr>
                                            <td className="hdrCol">Selected Chain</td>
                                            <td className="dtlCol">{formatChainAsNum(chainId)} - {chainName}</td>
                                        </tr>
                                        <tr>
                                            <td className="hdrCol">Capabilities on selected chain</td>
                                            <td className="dtlCol">{capabilities}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <hr />
                            {!supportAtomic ?
                                <div>
                                    The selected chain does not support Batch transactions via 7702 / 5792.
                                    <br />
                                    Please select a chain that supports it (Sepolia).
                                </div>
                                :
                                <div>
                                    <table>
                                        <thead>
                                            <tr>
                                                <td className="value">Txn No.</td>
                                                <td></td>
                                                <td>Value (Wei)</td>
                                                <td></td>
                                                <td>Address</td>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>1.</td>
                                                <td>Send</td>
                                                <td>
                                                    <input
                                                        className="value"
                                                        type="text"
                                                        value={val1}
                                                        onChange={(e) => handleValueChange(1, e)}
                                                    />
                                                </td>
                                                <td>to</td>
                                                <td>
                                                    <input
                                                        className="address"
                                                        type="text"
                                                        value={add1}
                                                        onChange={(e) => handleAddressChange(1, e)}
                                                    />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>2.</td>
                                                <td>Send</td>
                                                <td>
                                                    <input
                                                        className="value"
                                                        type="text"
                                                        value={val2}
                                                        onChange={(e) => handleValueChange(2, e)}
                                                    />
                                                </td>
                                                <td>to</td>
                                                <td>
                                                    <input
                                                        className="address"
                                                        type="text"
                                                        value={add2}
                                                        onChange={(e) => handleAddressChange(2, e)}
                                                    />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <br/>
                                    {processingTxn ?
                                        <>
                                            <div>Transaction in progress</div>
                                            <progress id="progress-bar"></progress>
                                        </>
                                        :
                                        <button onClick={() => handleSendCalls()} >
                                            Send 2 transactions in a batch
                                        </button>
                                    }
                                </div>
                            }
                            <hr />
                            <div>
                                <button onClick={() => handleDisconnect()} >
                                    Disconnect wallet
                                </button>
                            </div>
                        </div>
                    }
                </div> :
                <div>Please install MetaMask wallet extension and then continue.</div>
            }
            <hr />
            <div className="source">
                Source : <a href="https://github.com/mario-christopher/7702-Readiness" target="_blank">GitHub</a>
            </div>
        </>
    )
}