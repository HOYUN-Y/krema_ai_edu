/**
 * 한국부동산원 청약홈 공공데이터 API
 * Base URL: https://api.odcloud.kr/api
 *
 * [API 1] 분양정보 조회 서비스 (ApplyhomeInfoDetailSvc)
 *   - getAPTLttotPblancDetail     : APT 분양정보 상세조회
 *   - getAPTLttotPblancMdl        : APT 분양정보 주택형별 상세조회
 *
 * [API 2] 경쟁률 및 특별공급 신청현황 (ApplyhomeInfoCmpetRtSvc)
 *   - getAPTLttotPblancCmpet      : APT 분양정보/경쟁률 조회
 *   - getAPTSpsplyReqstStus       : APT 특별공급 신청현황 조회
 *
 * [API 3] 청약 신청·당첨자 정보 조회 (ApplyhomeStatSvc)
 *   - getAPTReqstAreaStat         : 지역별 청약 신청자 정보 조회
 *   - getAPTPrzwnerAreaStat       : 지역별 청약 당첨자 정보 조회
 *   - getAPTCmpetrtAreaStat       : 지역별 청약 경쟁률 정보 조회
 */

const BASE_URL = "https://api.odcloud.kr/api";
const SERVICE_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

async function fetchApi(path: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({
    page: "1",
    perPage: "20",
    serviceKey: SERVICE_KEY,
    ...params,
  });
  const url = `${BASE_URL}${path}?${qs.toString()}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`API error: ${res.status} (${url})`);
  return res.json();
}

// ── API 1: 분양정보 ────────────────────────────────────────────

/** APT 분양정보 상세조회 */
export async function getAPTAnnouncements(page = "1", perPage = "20") {
  const data = await fetchApi("/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail", {
    page, perPage,
  });
  return {
    totalCount: data?.totalCount ?? 0,
    items: (data?.data ?? []) as Record<string, string | number>[],
  };
}

/** APT 분양정보 주택형별 상세조회 */
export async function getAPTHouseTypes(houseManageNo: string) {
  const data = await fetchApi("/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancMdl", {
    "cond[HOUSE_MANAGE_NO::EQ]": houseManageNo,
    perPage: "50",
  });
  return (data?.data ?? []) as Record<string, string | number>[];
}

// ── API 2: 경쟁률 ──────────────────────────────────────────────

/** APT 분양정보/경쟁률 조회 */
export async function getAPTCompetition(page = "1", houseManageNo?: string) {
  const params: Record<string, string> = { page, perPage: "20" };
  if (houseManageNo) params["cond[HOUSE_MANAGE_NO::EQ]"] = houseManageNo;
  const data = await fetchApi("/ApplyhomeInfoCmpetRtSvc/v1/getAPTLttotPblancCmpet", params);
  return {
    totalCount: data?.totalCount ?? 0,
    items: (data?.data ?? []) as Record<string, string | number>[],
  };
}

/** APT 특별공급 신청현황 조회 */
export async function getSpecialSupply(page = "1") {
  const data = await fetchApi("/ApplyhomeInfoCmpetRtSvc/v1/getAPTSpsplyReqstStus", {
    page, perPage: "20",
  });
  return {
    totalCount: data?.totalCount ?? 0,
    items: (data?.data ?? []) as Record<string, string | number>[],
  };
}

// ── API 3: 신청·당첨자 통계 ────────────────────────────────────

/** 지역별 청약 신청자 정보 조회 */
export async function getReqstAreaStat(page = "1") {
  const data = await fetchApi("/ApplyhomeStatSvc/v1/getAPTReqstAreaStat", {
    page, perPage: "50",
  });
  return {
    totalCount: data?.totalCount ?? 0,
    items: (data?.data ?? []) as Record<string, string | number>[],
  };
}

/** 지역별 청약 당첨자 정보 조회 */
export async function getPrzwnerAreaStat(page = "1") {
  const data = await fetchApi("/ApplyhomeStatSvc/v1/getAPTPrzwnerAreaStat", {
    page, perPage: "50",
  });
  return {
    totalCount: data?.totalCount ?? 0,
    items: (data?.data ?? []) as Record<string, string | number>[],
  };
}

/** 지역별 청약 경쟁률 정보 조회 */
export async function getCmpetrtAreaStat(page = "1") {
  const data = await fetchApi("/ApplyhomeStatSvc/v1/getAPTCmpetrtAreaStat", {
    page, perPage: "50",
  });
  return {
    totalCount: data?.totalCount ?? 0,
    items: (data?.data ?? []) as Record<string, string | number>[],
  };
}
