const BASE_URL = "https://api.odcloud.kr/api";
const SERVICE_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

async function fetchApi(path: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({
    serviceKey: SERVICE_KEY,
    page: "1",
    perPage: "20",
    ...params,
  });
  const url = `${BASE_URL}${path}?${qs.toString()}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// 분양정보 조회 - APT 분양 공고 목록
export async function getAnnouncements(page = "1") {
  const data = await fetchApi("/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail", {
    page,
    perPage: "20",
  });
  return {
    totalCount: data?.totalCount ?? 0,
    items: data?.data ?? [],
  };
}

// 청약 경쟁률 - APT 경쟁률
export async function getCompetition(page = "1") {
  const data = await fetchApi("/ApplyhomeInfoCmpetRtSvc/v1/getAPTLttotPblancCmpet", {
    page,
    perPage: "20",
  });
  return {
    totalCount: data?.totalCount ?? 0,
    items: data?.data ?? [],
  };
}

// 특별공급 신청현황
export async function getSpecialSupply(page = "1") {
  const data = await fetchApi("/ApplyhomeInfoCmpetRtSvc/v1/getAPTSpsplyReqstStus", {
    page,
    perPage: "20",
  });
  return {
    totalCount: data?.totalCount ?? 0,
    items: data?.data ?? [],
  };
}

// 청약 신청·당첨자 통계 - 지역별
export async function getApplicantAreaStat(page = "1") {
  const data = await fetchApi("/ApplyhomeStatSvc/v1/getAPTReqstAreaStat", {
    page,
    perPage: "20",
  });
  return {
    totalCount: data?.totalCount ?? 0,
    items: data?.data ?? [],
  };
}
