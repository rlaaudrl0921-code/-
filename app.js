"use strict";

const numberFormat = new Intl.NumberFormat("ko-KR");

function validate(data) {
  if (!Array.isArray(data) || data.length !== 10) {
    throw new Error("신청목록은 지자체 10건이어야 합니다.");
  }
  data.forEach((item, index) => {
    const population = Number(item["인구수"]);
    const amount = Number(item["신청액"]);
    if (!item["지자체명"] || !Number.isFinite(population) || population < 0 || !Number.isFinite(amount) || amount < 0) {
      throw new Error(`${index + 1}번째 데이터의 지자체명·인구수·신청액을 확인하세요.`);
    }
  });
  return data;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
}

function render(input) {
  const data = validate(input).map(item => {
    const population = Number(item["인구수"]);
    const amount = Number(item["신청액"]);
    const limit = population * 10;
    return {...item, "인구수": population, "신청액": amount, "한도액": limit, "판정": amount > limit ? "반려" : "승인"};
  });

  document.querySelector("#rows").innerHTML = data.map(item => `
    <tr>
      <td><strong>${escapeHtml(item["지자체명"])}</strong></td>
      <td>${numberFormat.format(item["인구수"])}명</td>
      <td>${numberFormat.format(item["신청액"])}원</td>
      <td>${numberFormat.format(item["한도액"])}원</td>
      <td><span class="badge ${item["판정"] === "승인" ? "ok" : "no"}">${item["판정"]}</span></td>
    </tr>`).join("");

  const approved = data.filter(item => item["판정"] === "승인");
  document.querySelector("#approvedCount").textContent = `${approved.length}건`;
  document.querySelector("#rejectedCount").textContent = `${data.length - approved.length}건`;
  document.querySelector("#approvedTotal").textContent = `${numberFormat.format(approved.reduce((sum, item) => sum + item["신청액"], 0))}원`;
  document.querySelector("#status").textContent = `총 ${data.length}건 · 자동 판정 완료`;
}

async function init() {
  try {
    const response = await fetch("./신청목록.json", {cache: "no-store"});
    if (!response.ok) throw new Error(`데이터 파일 응답 오류 (${response.status})`);
    render(await response.json());
  } catch (error) {
    const errorBox = document.querySelector("#error");
    errorBox.hidden = false;
    errorBox.textContent = `신청목록.json을 읽지 못했습니다: ${error.message}`;
    document.querySelector("#status").textContent = "데이터 로드 실패";
  }
}

init();
