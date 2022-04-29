import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { ethers } from "ethers";
import { useCallback, useMemo } from "react";

const { default: Resolution } = require("@unstoppabledomains/resolution");
const resolution = new Resolution();

export interface UnstoppableDomainsResolver {
  /**
   * Resolves a UnstoppableDomains name to a corresponding address.
   * Important: If the name is already a valid address, this address will be returned.
   *
   * @returns null if the ENS name cannot be resolved.
   *
   * @param ensName ENS Name or address.
   */
  resolveName(ensName: string): Promise<string | null>;

  /**
   * @returns true, if UnstoppableDomains is enabled for current network.
   */
  isUDEnabled(): Promise<boolean>;
}

export const useUnstoppableDomainsResolver: () => UnstoppableDomainsResolver = () => {
  const { safe, sdk } = useSafeAppsSDK();
  const web3Provider = useMemo(() => new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk)), [sdk, safe]);
  const resolveCache = useMemo(() => new Map<string, string | null>(), []);

  const cachedResolveName = useCallback(
    async (udName: string) => {
      const cachedAddress = resolveCache.get(udName);
      const resolvedAddress = cachedAddress ?? (await resolution.addr(udName, "ETH"));
      if (!resolveCache.has(udName)) {
        resolveCache.set(udName, resolvedAddress);
      }
      return resolvedAddress;
    },
    [resolveCache],
  );

  const isUDEnabled = useCallback(async () => {
    return true; // always true
  }, [web3Provider]);

  return useMemo(
    () => ({
      resolveName: (ensName: string) => cachedResolveName(ensName),
      isUDEnabled: () => isUDEnabled(),
    }),
    [cachedResolveName, isUDEnabled],
  );
};
