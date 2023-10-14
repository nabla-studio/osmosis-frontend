import { RatePretty } from "@keplr-wallet/unit";
import { ObservableQueryPool } from "@osmosis-labs/stores";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import Link from "next/link";
import { FunctionComponent } from "react";
import { useTranslation } from "react-multi-lang";

import { Icon } from "~/components/assets";
import { useAssetInfoConfig } from "~/hooks";
import { useStore } from "~/stores";
import { CoinBalance, ObservableAssets } from "~/stores/assets";
import { QueriesExternalStore } from "~/stores/queries-external";

const numberOfAssetsToDisplay = 8;

const findUniqueAssetWithBalances = (
  memoedPools: ObservableQueryPool[],
  assetsStore: ObservableAssets,
  queriesExternalStore: QueriesExternalStore,
  numberOfUniqueAssetDenoms: number,
  tokenDenom: string
) => {
  const balances = [
    ...assetsStore.nativeBalances,
    ...assetsStore.unverifiedIbcBalances,
  ];

  const assetsToDisplay = new Set<string>();
  for (const pool of memoedPools) {
    if (assetsToDisplay.size === numberOfUniqueAssetDenoms) {
      break;
    }
    if (pool.poolAssets.some((asset) => asset.amount.denom === tokenDenom)) {
      assetsToDisplay.add(
        pool.poolAssets.find((asset) => asset.amount.denom !== tokenDenom)
          ?.amount.denom || ""
      );
    }
  }

  balances.sort((balance1, balance2) => {
    const marketCap1 =
      queriesExternalStore.queryMarketCaps.get(balance1.balance.denom) || 0;
    const marketCap2 =
      queriesExternalStore.queryMarketCaps.get(balance2.balance.denom) || 0;
    return marketCap2 - marketCap1;
  });

  for (const balance of balances) {
    if (balance.balance.denom === tokenDenom) {
      continue;
    }

    if (assetsToDisplay.size === numberOfAssetsToDisplay) {
      break;
    }

    assetsToDisplay.add(balance.balance.denom);
  }

  return {
    balances,
    assetsToDisplay,
  };
};

const RelatedAssets: FunctionComponent<{
  memoedPools: ObservableQueryPool[];
  tokenDenom: string;
}> = observer(({ memoedPools, tokenDenom }) => {
  const t = useTranslation();

  const { assetsStore, queriesExternalStore } = useStore();

  const { balances, assetsToDisplay } = findUniqueAssetWithBalances(
    memoedPools,
    assetsStore,
    queriesExternalStore,
    numberOfAssetsToDisplay,
    tokenDenom
  );

  return assetsToDisplay.size > 0 ? (
    <section className="flex flex-col gap-8 rounded-5xl border border-osmoverse-800 bg-osmoverse-900 p-10 md:p-6">
      <header>
        <h6 className="text-lg font-h6 leading-6">
          {t("tokenInfos.relatedAssets")}
        </h6>
      </header>
      <ul className="flex flex-col gap-8">
        {Array.from(assetsToDisplay.values()).map((assetDenom) => {
          const asset = balances.find(
            (balance) => balance.balance.denom === assetDenom
          )!;
          return <RelatedAsset key={assetDenom} coinBalance={asset} />;
        })}
      </ul>
    </section>
  ) : null;
});

const RelatedAssetSkeleton: FunctionComponent<{
  assetName: string;
  chainName: string;
  denom: string;
  iconUrl?: string;
  price: string;
  priceChange?: string;
}> = ({ assetName, chainName, denom, iconUrl, price, priceChange }) => {
  return (
    <Link href={`/assets/${denom}`}>
      <a className="flex cursor-pointer flex-row items-center justify-between self-stretch">
        <div className="flex flex-row items-center justify-center gap-3">
          {iconUrl ? (
            <Image src={iconUrl} alt="coin name" width={52} height={52} />
          ) : (
            <div className="h-12 w-12 rounded-full bg-osmoverse-800" />
          )}
          <div className="flex flex-col gap-1">
            <p className="text-base font-subtitle1 leading-6 text-osmoverse-100">
              {assetName}
            </p>
            <p className="text-sm font-body2 font-medium leading-5 text-osmoverse-300">
              {chainName}
            </p>
          </div>
        </div>
        <div className="flex flex-row items-center gap-5">
          <div className="flex flex-col items-end gap-1">
            <h6 className="text-lg font-h6 leading-6 text-osmoverse-100">
              {price}
            </h6>
            {priceChange && (
              <p className="text-sm font-subtitle2 font-medium leading-5 text-osmoverse-300">
                {priceChange}
              </p>
            )}
          </div>

          <Icon
            id="caret-down"
            className="-rotate-90 text-osmoverse-500"
            height={24}
            width={24}
          />
        </div>
      </a>
    </Link>
  );
};

const RelatedAsset: FunctionComponent<{
  coinBalance: CoinBalance;
}> = observer(({ coinBalance }) => {
  const { chainStore, priceStore, queriesExternalStore } = useStore();
  const assetInfoConfig = useAssetInfoConfig(
    coinBalance.balance.denom,
    queriesExternalStore,
    priceStore
  );

  const assetData = queriesExternalStore.queryTokenHistoricalChart.get(
    coinBalance.balance.denom,
    10080
  );

  let priceChange;
  if (assetData.getRawChartPrices && assetData.getRawChartPrices.length > 1) {
    const priceNow =
      assetData.getRawChartPrices[assetData.getRawChartPrices.length - 1].close;
    const price7daysAgo =
      assetData.getRawChartPrices[assetData.getRawChartPrices.length - 2].close;
    priceChange = new RatePretty((priceNow - price7daysAgo) / price7daysAgo);
  }

  return (
    <li>
      <RelatedAssetSkeleton
        key={coinBalance.balance.denom}
        assetName={coinBalance.balance.currency.coinDenom}
        chainName={
          chainStore.getChainFromCurrency(coinBalance.balance.denom)
            ?.chainName ?? ""
        }
        denom={coinBalance.balance.denom}
        iconUrl={coinBalance.balance.currency.coinImageUrl}
        price={assetInfoConfig.hoverPrice?.maxDecimals(2).toString() ?? ""}
        priceChange={priceChange?.maxDecimals(2).toString()}
      />
    </li>
  );
});

export default RelatedAssets;