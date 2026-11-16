/**
 * 국립과학수사연구원(NFS) 포털 인터랙티브 시뮬레이션 및 테마 제어 스크립트
 * 1. 주간/야간 모드 (Theme Toggle) 전환 및 LocalStorage 저장
 * 2. 3D 탄환 강선흔(Striation) 정렬 및 CMS / RMS / Likelihood Ratio(LR) 계산 로직
 * 3. DNA STR 전좌위 일치 판별 시뮬레이션
 * 4. 자동차 EDR(사고기록장치) 텔레메트리 그래프 시각화
 * 5. LC-HRMS 질량분석기 스펙트럼 피크 탐색
 */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTabs();
    initBulletSimulator();
    initDNASimulator();
    initEDRSimulator();
    initToxicologySimulator();
    initFAQ();
});

/* --------------------------------------------------------------------------
 * 테마 모드 제어 (주간 모드 / 야간 모드)
 * -------------------------------------------------------------------------- */
function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (!toggleBtn) return;

    const label = toggleBtn.querySelector('.theme-label');
    const savedTheme = localStorage.getItem('nfs_portal_theme') || 'light';

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('nfs_portal_theme', theme);
        if (label) {
            label.textContent = theme === 'dark' ? '주간모드' : '야간모드';
        }
        // 캔버스 다시 그리기 (배경색 및 선 대비 맞춤)
        window.dispatchEvent(new Event('themechange'));
    }

    applyTheme(savedTheme);

    toggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });
}

/* --------------------------------------------------------------------------
 * 탭 내비게이션
 * -------------------------------------------------------------------------- */
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
}

/* --------------------------------------------------------------------------
 * 1. 3D 탄환 강선흔(Striation) 시뮬레이터 (법과학 계산형태학)
 * -------------------------------------------------------------------------- */
function initBulletSimulator() {
    const canvasA = document.getElementById('canvas-bullet-a');
    const canvasB = document.getElementById('canvas-bullet-b');
    if (!canvasA || !canvasB) return;

    const ctxA = canvasA.getContext('2d');
    const ctxB = canvasB.getContext('2d');

    const rotateSlider = document.getElementById('bullet-rotate');
    const rotateVal = document.getElementById('rotate-val');
    const btnAutoAlign = document.getElementById('btn-auto-align');
    const btnVerify = document.getElementById('btn-verify-bullet');

    const valCms = document.getElementById('val-cms');
    const valRms = document.getElementById('val-rms');
    const valLr = document.getElementById('val-lr');
    const verdictEl = document.getElementById('bullet-verdict');
    const noteEl = document.getElementById('bullet-note');

    // 참값: 정렬 목표 각도 = 180도
    const TARGET_ANGLE = 180;

    // 탄환 표면 조흔(Striae) 프로파일 가상 데이터 (원주 방향 시뮬레이션)
    const grooves = [30, 75, 120, 180, 240, 290, 330];

    function drawBulletProfile(ctx, currentAngle, isEvidence) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        ctx.clearRect(0, 0, width, height);

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        // 배경 그리드 (미세 스캔 눈금)
        ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(0, 55, 100, 0.06)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // 탄환 표면 기저선 렌더링
        ctx.beginPath();
        ctx.strokeStyle = isEvidence ? '#e4022e' : (isDark ? '#38bdf8' : '#003764');
        ctx.lineWidth = 2.5;

        for (let x = 0; x < width; x++) {
            const normX = (x / width) * 360;
            const effAngle = (normX + currentAngle) % 360;
            
            // 강선 흔적 합성 (복합 삼각함수 + 특징적 홈)
            let depth = Math.sin((effAngle * Math.PI) / 45) * 15;
            depth += Math.sin((effAngle * Math.PI) / 15) * 8;
            depth += Math.cos((effAngle * Math.PI) / 5) * 3;

            // 주 조흔(Striae) 위치에 스크래치 피크 생성
            grooves.forEach(g => {
                const diff = Math.abs(effAngle - g);
                if (diff < 6 || Math.abs(diff - 360) < 6) {
                    depth -= 22 * Math.exp(-Math.pow(diff, 2) / 6);
                }
            });

            const y = height / 2 + depth;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 조흔(Striae) 3D 수직 스트라이프 표현
        grooves.forEach(g => {
            const screenX = (((g - currentAngle + 720) % 360) / 360) * width;
            if (screenX >= 0 && screenX <= width) {
                const grad = ctx.createLinearGradient(screenX - 3, 0, screenX + 3, 0);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(0.5, isEvidence ? 'rgba(228, 2, 46, 0.5)' : (isDark ? 'rgba(56, 189, 248, 0.6)' : 'rgba(0, 55, 100, 0.5)'));
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(screenX - 4, 15, 8, height - 30);
            }
        });
    }

    function updateSimulation() {
        const curAngle = parseInt(rotateSlider.value, 10);
        rotateVal.textContent = `${curAngle}°`;

        drawBulletProfile(ctxA, TARGET_ANGLE, true);
        drawBulletProfile(ctxB, curAngle, false);

        // 오차 및 일치도 평가
        const angleDiff = Math.abs(curAngle - TARGET_ANGLE);
        
        if (angleDiff <= 2) {
            verdictEl.textContent = '동일 총기 발사흔 판정 (일치)';
            verdictEl.className = 'result-status status-match';
            valCms.textContent = '8 Lines (기준치 6 초과)';
            valRms.textContent = '0.024 µm (오차 < 0.05)';
            valLr.textContent = '1.8 × 10⁷ (결정적 증거)';
            noteEl.innerHTML = '<strong>[법과학적 소견]</strong> 3D 표면 ICP 정렬 결과, 연속일치조흔(CMS) 및 미세 지형 RMS 오차가 유의수준 95% 신뢰구간 내에서 완벽하게 부합합니다.';
        } else if (angleDiff <= 15) {
            verdictEl.textContent = '근접 정렬 (미세 회전 필요)';
            verdictEl.className = 'result-status status-detected';
            valCms.textContent = '3 Lines';
            valRms.textContent = `${(angleDiff * 0.08).toFixed(3)} µm`;
            valLr.textContent = '4.2 × 10²';
            noteEl.textContent = '강선 홈 패턴이 유사하게 접근 중입니다. 각도를 조금 더 미세 조정하거나 자동 정렬을 실행해 보세요.';
        } else {
            verdictEl.textContent = '불일치 / 위상차 발생';
            verdictEl.className = 'result-status';
            valCms.textContent = '0 Lines';
            valRms.textContent = `${(angleDiff * 0.15).toFixed(3)} µm`;
            valLr.textContent = '1.0 이하 (무의미)';
            noteEl.textContent = '회전 슬라이더를 조작하여 두 탄환 표면의 세로 조흔 선을 일치시켜 주십시오.';
        }
    }

    rotateSlider.addEventListener('input', updateSimulation);

    btnAutoAlign.addEventListener('click', () => {
        let current = parseInt(rotateSlider.value, 10);
        const interval = setInterval(() => {
            if (current < TARGET_ANGLE) {
                current += 3;
                if (current > TARGET_ANGLE) current = TARGET_ANGLE;
            } else if (current > TARGET_ANGLE) {
                current -= 3;
                if (current < TARGET_ANGLE) current = TARGET_ANGLE;
            }
            rotateSlider.value = current;
            updateSimulation();

            if (current === TARGET_ANGLE) {
                clearInterval(interval);
            }
        }, 20);
    });

    btnVerify.addEventListener('click', () => {
        updateSimulation();
    });

    window.addEventListener('themechange', updateSimulation);

    updateSimulation();
}

/* --------------------------------------------------------------------------
 * 2. DNA STR 유전자형 일치 판별 시뮬레이터
 * -------------------------------------------------------------------------- */
function initDNASimulator() {
    const btnCalc = document.getElementById('btn-calc-dna');
    const resultBox = document.getElementById('dna-result');
    if (!btnCalc || !resultBox) return;

    btnCalc.addEventListener('click', () => {
        resultBox.style.display = 'block';
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

/* --------------------------------------------------------------------------
 * 3. 자동차 EDR 급발진 의혹 분석 시뮬레이터 (공학 분석)
 * -------------------------------------------------------------------------- */
function initEDRSimulator() {
    const canvas = document.getElementById('canvas-edr');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const btnReplay = document.getElementById('btn-replay-edr');
    const timerEl = document.getElementById('edr-timer');

    const width = canvas.width;
    const height = canvas.height;

    const times = [-5.0, -4.5, -4.0, -3.5, -3.0, -2.5, -2.0, -1.5, -1.0, -0.5, 0.0];
    const speed = [42, 45, 52, 65, 82, 98, 115, 128, 137, 142, 145]; // km/h
    const aps = [15, 20, 45, 99, 99, 99, 99, 99, 99, 99, 99]; // %

    let progressIndex = times.length;

    function renderEDR(maxIdx) {
        ctx.clearRect(0, 0, width, height);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        const padLeft = 60;
        const padRight = 40;
        const padTop = 30;
        const padBottom = 40;
        const chartW = width - padLeft - padRight;
        const chartH = height - padTop - padBottom;

        // 배경 그리드
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padTop + (chartH / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(width - padRight, y);
            ctx.stroke();

            ctx.fillStyle = isDark ? '#64748b' : '#64748b';
            ctx.font = '10px monospace';
            ctx.fillText(`${150 - i * 30}`, padLeft - 30, y + 3);
        }

        times.forEach((t, i) => {
            const x = padLeft + (chartW / (times.length - 1)) * i;
            ctx.fillText(`${t}s`, x - 12, height - padBottom + 20);
        });

        // 범례
        const speedColor = isDark ? '#38bdf8' : '#003764';
        const apsColor = '#e4022e';

        ctx.fillStyle = speedColor;
        ctx.fillRect(width - 240, 12, 12, 12);
        ctx.fillText('차량속도 (km/h)', width - 222, 22);

        ctx.fillStyle = apsColor;
        ctx.fillRect(width - 130, 12, 12, 12);
        ctx.fillText('가속페달 APS (%)', width - 112, 22);

        // 1. 차량 속도 라인
        ctx.beginPath();
        ctx.strokeStyle = speedColor;
        ctx.lineWidth = 3;
        for (let i = 0; i < maxIdx; i++) {
            const x = padLeft + (chartW / (times.length - 1)) * i;
            const y = padTop + chartH - (speed[i] / 150) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 2. 가속페달(APS) 라인
        ctx.beginPath();
        ctx.strokeStyle = apsColor;
        ctx.lineWidth = 2.5;
        for (let i = 0; i < maxIdx; i++) {
            const x = padLeft + (chartW / (times.length - 1)) * i;
            const y = padTop + chartH - (aps[i] / 150) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        for (let i = 0; i < maxIdx; i++) {
            const x = padLeft + (chartW / (times.length - 1)) * i;
            const ySpeed = padTop + chartH - (speed[i] / 150) * chartH;
            const yAps = padTop + chartH - (aps[i] / 150) * chartH;

            ctx.fillStyle = speedColor;
            ctx.beginPath();
            ctx.arc(x, ySpeed, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = apsColor;
            ctx.beginPath();
            ctx.arc(x, yAps, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderEDR(progressIndex);

    btnReplay.addEventListener('click', () => {
        let cur = 1;
        btnReplay.disabled = true;
        const interval = setInterval(() => {
            renderEDR(cur);
            timerEl.textContent = `충돌 전 ${times[cur - 1]}초 (차속: ${speed[cur - 1]}km/h, APS: ${aps[cur - 1]}%)`;
            cur++;
            if (cur > times.length) {
                clearInterval(interval);
                btnReplay.disabled = false;
                timerEl.textContent = '충돌 시점 (0.0초) - 분석 완료';
            }
        }, 220);
    });

    window.addEventListener('themechange', () => renderEDR(progressIndex));
}

/* --------------------------------------------------------------------------
 * 4. 법독성학 질량분석기 (LC-HRMS Spectrum) 시뮬레이터
 * -------------------------------------------------------------------------- */
function initToxicologySimulator() {
    const canvas = document.getElementById('canvas-spec');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const filterBtns = document.querySelectorAll('.drug-filter-btn');
    const toxStatus = document.getElementById('tox-status');
    const toxDesc = document.getElementById('tox-desc');

    const width = canvas.width;
    const height = canvas.height;

    let activeSample = 'sample1';

    const dataCases = {
        sample1: {
            title: '메트암페타민(필로폰) 양성 검출 (350 ng/mL)',
            statusClass: 'result-status status-detected',
            desc: '혈액 시료에서 분자량 피크(m/z 150.12 및 주요 파편 이온 m/z 91.05, 119.08)가 명확하게 검출되어 급성 투약 사실이 확인되었습니다.',
            peaks: [
                { mz: 91.05, intensity: 58 },
                { mz: 119.08, intensity: 35 },
                { mz: 150.12, intensity: 98, label: 'Methamphetamine [M+H]+ (150.12)' },
                { mz: 182.20, intensity: 15 }
            ]
        },
        sample2: {
            title: '대마(THC-COOH 대사체) 만성 투약 양성',
            statusClass: 'result-status status-detected',
            desc: '모발 분절 감정 결과, 모근 부위 3cm 구간에서 THC 주요 대사체 피크(m/z 345.20)가 분리 검출되어 3개월 전 투약 이력이 입증되었습니다.',
            peaks: [
                { mz: 299.15, intensity: 40 },
                { mz: 327.18, intensity: 62 },
                { mz: 345.20, intensity: 94, label: '11-nor-9-Carboxy-THC (345.20)' },
                { mz: 363.22, intensity: 22 }
            ]
        }
    };

    function drawSpectrum(caseKey) {
        const item = dataCases[caseKey];
        ctx.clearRect(0, 0, width, height);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        const padLeft = 50;
        const padRight = 30;
        const padTop = 40;
        const padBottom = 30;
        const chartW = width - padLeft - padRight;
        const chartH = height - padTop - padBottom;

        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padLeft, padTop);
        ctx.lineTo(padLeft, height - padBottom);
        ctx.lineTo(width - padRight, height - padBottom);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '11px monospace';
        ctx.fillText('상대 강도(%)', padLeft - 45, padTop - 12);
        ctx.fillText('질량 대 전하비 (m/z)', width / 2 - 40, height - 10);

        // 노이즈 베이스라인
        ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0, 55, 100, 0.15)';
        ctx.beginPath();
        for (let x = padLeft; x < width - padRight; x += 3) {
            const noise = Math.random() * 4;
            const y = height - padBottom - noise;
            if (x === padLeft) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 피크
        item.peaks.forEach(p => {
            const minMz = 50;
            const maxMz = 400;
            const x = padLeft + ((p.mz - minMz) / (maxMz - minMz)) * chartW;
            const peakHeight = (p.intensity / 100) * chartH;
            const y = height - padBottom - peakHeight;

            ctx.strokeStyle = p.label ? '#d97706' : (isDark ? '#38bdf8' : '#003764');
            ctx.lineWidth = p.label ? 3 : 2;
            ctx.beginPath();
            ctx.moveTo(x, height - padBottom);
            ctx.lineTo(x, y);
            ctx.stroke();

            ctx.fillStyle = p.label ? '#d97706' : '#64748b';
            ctx.font = '10px monospace';
            ctx.fillText(`m/z ${p.mz}`, x - 18, y - 6);

            if (p.label) {
                ctx.fillStyle = '#b45309';
                ctx.font = 'bold 11px sans-serif';
                ctx.fillText(`★ ${p.label}`, x - 50, y - 20);
            }
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeSample = btn.getAttribute('data-sample');
            const info = dataCases[activeSample];
            if (info) {
                toxStatus.textContent = info.title;
                toxStatus.className = info.statusClass;
                toxDesc.textContent = info.desc;
                drawSpectrum(activeSample);
            }
        });
    });

    window.addEventListener('themechange', () => drawSpectrum(activeSample));

    drawSpectrum('sample1');
}

/* --------------------------------------------------------------------------
 * 자주 묻는 질문 (Accordion FAQ)
 * -------------------------------------------------------------------------- */
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const btn = item.querySelector('.faq-question');
        btn.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            faqItems.forEach(i => i.classList.remove('open'));
            if (!isOpen) {
                item.classList.add('open');
            }
        });
    });
}
