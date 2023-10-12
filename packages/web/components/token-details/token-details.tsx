import { FiatCurrency } from "@keplr-wallet/types";
import { Dec, PricePretty } from "@keplr-wallet/unit";
import { observer } from "mobx-react-lite";
import React, { FunctionComponent, useMemo, useState } from "react";
import { useTranslation } from "react-multi-lang";

import { Icon } from "~/components/assets";
import LinkIconButton from "~/components/buttons/link-icon-button";
import Markdown from "~/components/markdown";
import { useCurrentLanguage } from "~/hooks";
import { useTokenCMS } from "~/hooks/use-token-cms";
import { useStore } from "~/stores";
import { formatPretty } from "~/utils/formatter";

const TEXT_CHAR_LIMIT = 450;

export interface TokenDetailsProps {
  denom: string;
}

const TokenDetails = ({ denom }: TokenDetailsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslation();
  const language = useCurrentLanguage();
  const { queriesExternalStore, priceStore, chainStore } = useStore();
  const { details } = useTokenCMS({
    denom,
    lang: language,
  });

  const isExpandable = useMemo(
    () => details?.description && details?.description.length > TEXT_CHAR_LIMIT,
    [details]
  );

  const expandedText = useMemo(() => {
    if (isExpandable && !isExpanded) {
      return details?.description
        ? details.description.substring(0, TEXT_CHAR_LIMIT)
        : "";
    }

    return details?.description;
  }, [isExpandable, isExpanded, details]);

  const chain = chainStore.getChainFromCurrency(denom);

  const balances = chain?.currencies ?? [];
  const coinGeckoId = balances.find(
    (bal) => bal.coinDenom.toUpperCase() === denom.toUpperCase()
  )?.coinGeckoId;

  const usdFiat = priceStore.getFiatCurrency("usd");
  const coingeckoCoinInfo = coinGeckoId
    ? queriesExternalStore.queryCoinGeckoCoinsInfos.get(coinGeckoId)
    : undefined;
  const marketCapRank = coingeckoCoinInfo?.marketCapRank;
  const totalValueLocked = coingeckoCoinInfo?.totalValueLocked;
  const marketCap = queriesExternalStore.queryMarketCaps.get(denom);
  const circulatingSupply = queriesExternalStore.queryCirculatingSupplies.get(
    denom.toLowerCase()
  ).circulatingSupply;

  return (
    <section className="flex flex-col items-start gap-3 self-stretch rounded-5xl border border-osmoverse-800 bg-osmoverse-900 p-10 xl:gap-6 md:p-6 1.5xs:gap-6">
      <TokenStats
        usdFiat={usdFiat}
        marketCap={marketCap}
        marketCapRank={marketCapRank}
        totalValueLocked={totalValueLocked}
        circulatingSupply={circulatingSupply}
      />
      {details?.name && details?.description && (
        <div className="flex flex-col items-start self-stretch">
          <div className="flex flex-col items-start gap-4.5 self-stretch 1.5xs:gap-6">
            <div className="flex items-center gap-8 1.5xs:flex-col 1.5xs:gap-4">
              <h6 className="text-lg font-h6 leading-6 text-osmoverse-100">
                {t("tokenInfos.aboutDenom", { name: details.name })}
              </h6>
              <div className="flex items-center gap-2">
                {details?.twitterURL && (
                  <LinkIconButton
                    href={details.twitterURL}
                    mode="icon-social"
                    size="md-icon-social"
                    aria-label={t("tokenInfos.ariaViewOn", { name: "X" })}
                    icon={
                      <Icon className="h-4 w-4 text-osmoverse-400" id="X" />
                    }
                  />
                )}
                {details?.websiteURL && (
                  <LinkIconButton
                    href={details.websiteURL}
                    mode="icon-social"
                    size="md-icon-social"
                    aria-label={t("tokenInfos.ariaView", { name: "website" })}
                    icon={
                      <Icon className="h-6 w-6 text-osmoverse-400" id="web" />
                    }
                  />
                )}
                {details?.coingeckoURL && (
                  <LinkIconButton
                    href={details.coingeckoURL}
                    mode="icon-social"
                    size="md-icon-social"
                    aria-label={t("tokenInfos.ariaViewOn", {
                      name: "CoinGecko",
                    })}
                    icon={
                      <Icon
                        className="h-10.5 w-10.5 text-osmoverse-300"
                        id="coingecko"
                      />
                    }
                  />
                )}
              </div>
            </div>
            <div
              className={`${
                !isExpanded && isExpandable && "tokendetailshadow"
              } relative self-stretch`}
            >
              <div className="breakspaces font-base self-stretch font-subtitle1 text-osmoverse-200 transition-all">
                <Markdown>{expandedText ?? ""}</Markdown>
              </div>
              {isExpandable && (
                <button
                  className={`${
                    !isExpanded && "bottom-0"
                  } absolute z-10 flex items-center gap-1 self-stretch`}
                  onClick={() => setIsExpanded((v) => !v)}
                >
                  <p className="font-base leading-6 text-wosmongton-300">
                    {isExpanded
                      ? t("tokenInfos.collapse")
                      : t("components.show.more")}
                  </p>
                  <div className={`${isExpanded && "rotate-180"}`}>
                    <Icon
                      id="caret-down"
                      className="text-wosmongton-300"
                      height={24}
                      width={24}
                    />
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default observer(TokenDetails);

interface TokenStatsProps {
  usdFiat?: FiatCurrency;
  marketCapRank?: number;
  totalValueLocked?: number;
  marketCap?: number;
  circulatingSupply?: number;
}

const TokenStats: FunctionComponent<TokenStatsProps> = observer(
  ({
    usdFiat,
    marketCap,
    marketCapRank,
    totalValueLocked,
    circulatingSupply,
  }) => {
    const t = useTranslation();
    return (
      <ul className="flex flex-wrap items-end gap-20 self-stretch 2xl:gap-y-6">
        <li className="flex flex-col items-start gap-3">
          <p className="text-base font-subtitle1 leading-6 text-osmoverse-300">
            {t("tokenInfos.marketCapRank")}
          </p>
          <h5 className="text-xl font-h5 leading-8">
            {marketCapRank ? `#${marketCapRank}` : t("tokenInfos.noData")}
          </h5>
        </li>
        <li className="flex flex-col items-start gap-3">
          <p className="text-base font-subtitle1 leading-6 text-osmoverse-300">
            {t("tokenInfos.marketCap")}
          </p>
          <h5 className="text-xl font-h5 leading-8">
            {marketCap && usdFiat
              ? formatPretty(new PricePretty(usdFiat, new Dec(marketCap)))
              : t("tokenInfos.noData")}
          </h5>
        </li>
        <li className="flex flex-col items-start gap-3">
          <p className="text-base font-subtitle1 leading-6 text-osmoverse-300">
            {t("tokenInfos.circulatingSupply")}
          </p>
          <h5 className="text-xl font-h5 leading-8">
            {circulatingSupply && usdFiat
              ? formatPretty(
                  new PricePretty(usdFiat, new Dec(circulatingSupply))
                )
              : t("tokenInfos.noData")}
          </h5>
        </li>
        <li className="flex flex-col items-start gap-3">
          <p className="text-base font-subtitle1 leading-6 text-osmoverse-300">
            {t("tokenInfos.tvl")}
          </p>
          <h5 className="text-xl font-h5 leading-8">
            {totalValueLocked && usdFiat
              ? formatPretty(
                  new PricePretty(usdFiat, new Dec(totalValueLocked))
                )
              : t("tokenInfos.noData")}
          </h5>
        </li>
      </ul>
    );
  }
);
