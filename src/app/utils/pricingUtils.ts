import { PricingCode } from '../store/pricingCodesStore';
import { MarketResearch } from '../store/marketResearchStore';

/**
 * Determines whether a pricing code has effective market research coverage.
 *
 * - Own research always satisfies the requirement.
 * - For non-'Serviço' codes that belong to a service group, the requirement is
 *   satisfied when ALL 'Serviço' codes in the same group already have research.
 */
export function hasEffectiveMarketResearch(
  code: PricingCode,
  allCodes: PricingCode[],
  getResearchByCode: (codeKey: string) => MarketResearch | undefined
): boolean {
  const codeRef = code.codigoAvulso || code.codigoAtrelado || '';
  const research = codeRef ? getResearchByCode(codeRef) : undefined;
  if (research && research.precosConcorrentes.length > 0) return true;

  if (code.tipo !== 'Serviço' && code.grupoServico) {
    const groupServiceCodes = allCodes.filter(
      (c) => c.grupoServico === code.grupoServico && c.tipo === 'Serviço'
    );
    if (groupServiceCodes.length > 0) {
      return groupServiceCodes.every((c) => {
        const ref = c.codigoAvulso || c.codigoAtrelado || '';
        const r = ref ? getResearchByCode(ref) : undefined;
        return r && r.precosConcorrentes.length > 0;
      });
    }
  }
  return false;
}
