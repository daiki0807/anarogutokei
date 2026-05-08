document.addEventListener('DOMContentLoaded', () => {
    const clockFace = document.getElementById('clock-face');
    const clock = document.getElementById('clock');
    const hourHand = document.getElementById('hour-hand');
    const minuteHand = document.getElementById('minute-hand');
    const digitalHour = document.getElementById('digital-hour');
    const digitalMinute = document.getElementById('digital-minute');
    const btnCurrentTime = document.getElementById('btn-current-time');
    const btnReset = document.getElementById('btn-reset');

    // State
    let currentHour = 12;
    let currentMinute = 0;
    
    // Drag state
    let isDraggingHour = false;
    let isDraggingMinute = false;
    let clockCenter = { x: 0, y: 0 };
    let previousMinuteAngle = 0;

    // --- 初期化 ---
    function initClock() {
        createMarkers(clockFace, 100, 132, 135);
        updateClockCenter();
        setTime(currentHour, currentMinute);
    }

    // 文字盤の目盛りと数字を生成する共通関数
    function createMarkers(faceElement, numRadius, hourMarkerY, minuteMarkerY, isMini = false) {
        faceElement.innerHTML = ''; // クリア
        for (let i = 0; i < 60; i++) {
            const marker = document.createElement('div');
            const angle = i * 6; // 360度 / 60
            
            if (i % 5 === 0) {
                // 5分ごとの目盛り（太め）
                marker.className = 'marker hour-marker';
                if (isMini) {
                    marker.style.width = '2px';
                    marker.style.height = '6px';
                }
                
                // 数字の配置
                const number = document.createElement('div');
                number.className = 'number';
                let hourText = i / 5;
                if (hourText === 0) hourText = 12;
                number.textContent = hourText;
                
                if (isMini) {
                    number.style.fontSize = '1rem'; // ミニ時計用のフォントサイズ
                }
                
                // 数字の座標計算
                const rad = (angle - 90) * (Math.PI / 180);
                const tx = numRadius * Math.cos(rad);
                const ty = numRadius * Math.sin(rad);
                
                number.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;
                faceElement.appendChild(number);
                
                // 分のガイド数字の配置（外側）
                if (!isMini) {
                    const guideNumber = document.createElement('div');
                    guideNumber.className = 'minute-guide-number hidden';
                    guideNumber.textContent = i === 0 ? 0 : i;
                    
                    const guideRadius = 158; // 時計の枠より少し外側
                    const gtx = guideRadius * Math.cos(rad);
                    const gty = guideRadius * Math.sin(rad);
                    
                    guideNumber.style.transform = `translate(calc(-50% + ${gtx}px), calc(-50% + ${gty}px))`;
                    faceElement.appendChild(guideNumber);
                }
                
                // 目盛りの配置
                marker.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(${hourMarkerY}px)`;
            } else {
                // 1分ごとの目盛り
                marker.className = 'marker minute-marker';
                if (isMini) {
                    marker.style.width = '1px';
                    marker.style.height = '3px';
                }
                marker.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(${minuteMarkerY}px)`;
            }
            faceElement.appendChild(marker);
        }
    }

    function updateClockCenter() {
        const rect = clock.getBoundingClientRect();
        clockCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    window.addEventListener('resize', updateClockCenter);
    window.addEventListener('scroll', updateClockCenter);

    // --- 時刻の設定と表示更新 ---
    function setTime(h, m) {
        // 正規化
        if (m >= 60) {
            h += Math.floor(m / 60);
            m = m % 60;
        } else if (m < 0) {
            h += Math.floor(m / 60);
            m = (m % 60 + 60) % 60;
        }
        
        if (h >= 24) h = h % 24;
        if (h < 0) h = (h % 24 + 24) % 24;

        currentHour = h;
        currentMinute = m;

        updateVisuals();
    }

    function updateVisuals() {
        // デジタル表示
        let displayHour = currentHour % 12;
        if (displayHour === 0) displayHour = 12;
        
        digitalHour.textContent = displayHour;
        digitalMinute.textContent = currentMinute.toString().padStart(2, '0');

        // アナログ表示（角度の計算）
        // 分針：1分で6度
        const minuteAngle = currentMinute * 6;
        // 時針：1時間で30度 + 1分で0.5度
        const hourAngle = (currentHour % 12) * 30 + (currentMinute * 0.5);

        minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
        hourHand.style.transform = `rotate(${hourAngle}deg)`;
    }

    // --- ドラッグ操作ロジック ---
    function getAngle(e) {
        // タッチイベントかマウスイベントか判別
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const dx = clientX - clockCenter.x;
        const dy = clientY - clockCenter.y;
        
        // Atan2は-PI から PI を返す。時計の真上が0度になるように調整
        let theta = Math.atan2(dy, dx) * (180 / Math.PI); // -180 ~ 180
        theta = theta + 90; // 真上を0とする
        if (theta < 0) theta += 360;
        
        return theta;
    }

    // イベントリスナーの登録
    hourHand.addEventListener('pointerdown', (e) => {
        isDraggingHour = true;
        hourHand.style.transition = 'none'; // ドラッグ中はアニメーションを切る
        e.preventDefault(); // タッチデバイスのスクロール防止
        updateClockCenter();
    });

    minuteHand.addEventListener('pointerdown', (e) => {
        isDraggingMinute = true;
        minuteHand.style.transition = 'none';
        hourHand.style.transition = 'none'; // 連動して動くため
        previousMinuteAngle = currentMinute * 6;
        e.preventDefault();
        updateClockCenter();
    });

    document.addEventListener('pointermove', (e) => {
        if (!isDraggingHour && !isDraggingMinute) return;
        
        const angle = getAngle(e);

        if (isDraggingMinute) {
            // 分針のドラッグ
            let newMinute = Math.round(angle / 6);
            if (newMinute === 60) newMinute = 0;
            
            // 境界をまたいだかどうかの判定（59分<->0分）
            let angleDiff = angle - previousMinuteAngle;
            if (angleDiff > 180) angleDiff -= 360;
            if (angleDiff < -180) angleDiff += 360;
            
            if (angleDiff > 100) {
                // 時計回りに0時をまたいだ(ex: 350 -> 10) - 実際には角度が急に減るのでdiffはマイナスになるが…
                // 厳密には前の分との差分を見る
            }

            // よりシンプルなアプローチ：
            // 前回の角度との差分を分に換算して加算する
            let minuteDiff = Math.round(angleDiff / 6);
            
            // 異常な飛びを防ぐ（素早く回した場合など）
            if (Math.abs(minuteDiff) > 30) {
                minuteDiff = minuteDiff > 0 ? minuteDiff - 60 : minuteDiff + 60;
            }

            if (minuteDiff !== 0) {
                setTime(currentHour, currentMinute + minuteDiff);
                previousMinuteAngle = currentMinute * 6; // 角度を更新
            }

        } else if (isDraggingHour) {
            // 時針のドラッグ
            // 角度から単純に「何時か」を決定する（分は維持するか、0にするか）
            // 学習用なので、時針を動かしたときは分をそのままにする
            let newHour = Math.round(angle / 30);
            if (newHour === 0) newHour = 12;
            
            // 午前午後を維持するための工夫
            const isAm = currentHour < 12;
            let finalHour = newHour;
            if (!isAm && newHour < 12) {
                finalHour += 12;
            } else if (isAm && newHour === 12) {
                finalHour = 0;
            }
            
            if (currentHour !== finalHour) {
                setTime(finalHour, currentMinute);
            }
        }
    });

    document.addEventListener('pointerup', () => {
        if (isDraggingHour || isDraggingMinute) {
            isDraggingHour = false;
            isDraggingMinute = false;
            // アニメーションを元に戻す
            hourHand.style.transition = 'transform 0.1s cubic-bezier(0.4, 2.08, 0.55, 0.44)';
            minuteHand.style.transition = 'transform 0.1s cubic-bezier(0.4, 2.08, 0.55, 0.44)';
        }
    });

    // --- ボタン操作 ---
    btnCurrentTime.addEventListener('click', () => {
        const now = new Date();
        setTime(now.getHours(), now.getMinutes());
    });

    btnReset.addEventListener('click', () => {
        setTime(12, 0);
    });

    const btnToggleMinuteGuide = document.getElementById('btn-toggle-minute-guide');
    let showMinuteGuide = false;

    btnToggleMinuteGuide.addEventListener('click', () => {
        showMinuteGuide = !showMinuteGuide;
        const guides = document.querySelectorAll('.minute-guide-number');
        guides.forEach(guide => {
            if (showMinuteGuide) {
                guide.classList.remove('hidden');
            } else {
                guide.classList.add('hidden');
            }
        });
        
        // ボタンの見た目を変える
        if (showMinuteGuide) {
            btnToggleMinuteGuide.classList.remove('secondary-btn');
            btnToggleMinuteGuide.classList.add('primary-btn');
        } else {
            btnToggleMinuteGuide.classList.remove('primary-btn');
            btnToggleMinuteGuide.classList.add('secondary-btn');
        }
    });

    // --- 計算モードのロジック ---
    const btnCalcMode = document.getElementById('btn-calc-mode');
    const calcModal = document.getElementById('calc-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const calcStartTimeText = document.getElementById('calc-start-time');
    const calcDurationText = document.getElementById('calc-duration');
    const calcEndTimeText = document.getElementById('calc-end-time-display');
    const btnShowCalc = document.getElementById('btn-show-calc');
    const calcResult = document.getElementById('calc-result');
    const durBtns = document.querySelectorAll('.dur-btn');
    
    // タブ関連の要素
    const tabDuration = document.getElementById('tab-duration');
    const tabEndtime = document.getElementById('tab-endtime');
    const displayDuration = document.getElementById('display-duration');
    const displayEndtime = document.getElementById('display-endtime');
    const timeBtns = document.querySelectorAll('.time-btn');
    
    let calcDuration = 0;
    let currentCalcMode = 'duration'; // 'duration' or 'endtime'
    
    function formatTimeJP(h, m) {
        let displayH = h % 12;
        if (displayH === 0) displayH = 12;
        return `${displayH}時${m.toString().padStart(2, '0')}分`;
    }

    function updateEndtimeDisplay() {
        let endM = currentMinute + calcDuration;
        let endH = currentHour;
        
        if (endM >= 60) {
            endH += Math.floor(endM / 60);
            endM = endM % 60;
        } else if (endM < 0) {
            endH += Math.floor(endM / 60);
            endM = (endM % 60 + 60) % 60;
        }
        
        if (endH >= 24) endH = endH % 24;
        if (endH < 0) endH = (endH % 24 + 24) % 24;
        
        calcEndTimeText.textContent = formatTimeJP(endH, endM);
    }

    // タブの切り替え処理
    tabDuration.addEventListener('click', () => {
        currentCalcMode = 'duration';
        tabDuration.classList.add('active');
        tabEndtime.classList.remove('active');
        displayDuration.classList.remove('hidden');
        displayEndtime.classList.add('hidden');
        timeBtns.forEach(btn => btn.classList.add('hidden'));
        document.getElementById('calc-start-label-prefix').textContent = 'いまのじかん: ';
    });

    tabEndtime.addEventListener('click', () => {
        currentCalcMode = 'endtime';
        tabEndtime.classList.add('active');
        tabDuration.classList.remove('active');
        displayDuration.classList.add('hidden');
        displayEndtime.classList.remove('hidden');
        timeBtns.forEach(btn => btn.classList.remove('hidden'));
        document.getElementById('calc-start-label-prefix').textContent = 'スタート: ';
        updateEndtimeDisplay(); // 切り替え時にゴール時刻を計算して表示
    });

    btnCalcMode.addEventListener('click', () => {
        calcModal.classList.remove('hidden');
        calcStartTimeText.textContent = formatTimeJP(currentHour, currentMinute);
        calcDuration = 0;
        calcDurationText.textContent = calcDuration;
        updateEndtimeDisplay();
        calcResult.classList.add('hidden');
    });

    btnCloseModal.addEventListener('click', () => {
        calcModal.classList.add('hidden');
    });

    durBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const val = parseInt(e.target.getAttribute('data-val'), 10);
            calcDuration += val;
            calcDurationText.textContent = calcDuration;
            updateEndtimeDisplay();
            
            // 図を表示したままボタンを押した場合、自動的に図を更新する
            if (!calcResult.classList.contains('hidden')) {
                btnShowCalc.click();
            }
        });
    });

    // ミニ時計の針を更新する関数
    function updateMiniClock(prefix, h, m) {
        const hourHand = document.getElementById(`${prefix}-hour-hand`);
        const minuteHand = document.getElementById(`${prefix}-minute-hand`);
        const mAngle = m * 6;
        const hAngle = (h % 12) * 30 + (m * 0.5);
        minuteHand.style.transform = `rotate(${mAngle}deg)`;
        hourHand.style.transform = `rotate(${hAngle}deg)`;
    }

    btnShowCalc.addEventListener('click', () => {
        if (calcDuration === 0) return; // 0分の場合は何もしない
        
        calcResult.classList.remove('hidden');
        
        // スタート時計とゴール時計の文字盤生成
        const startFace = document.querySelector('#diagram-start-clock .mini-clock-face');
        if (startFace.children.length === 0) createMarkers(startFace, 40, -50, -52, true);
        const endFace = document.querySelector('#diagram-end-clock .mini-clock-face');
        if (endFace.children.length === 0) createMarkers(endFace, 40, -50, -52, true);

        // ゴール時刻の計算
        let endM = currentMinute + calcDuration;
        let endH = currentHour;
        
        if (endM >= 60) {
            endH += Math.floor(endM / 60);
            endM = endM % 60;
        } else if (endM < 0) {
            endH += Math.floor(endM / 60);
            endM = (endM % 60 + 60) % 60;
        }
        
        if (endH >= 24) endH = endH % 24;
        if (endH < 0) endH = (endH % 24 + 24) % 24;
        
        const isForward = calcDuration >= 0;
        const absDuration = Math.abs(calcDuration);

        // 過去に戻る計算の場合は左右の時計を入れ替える（右が今の時間、左が昔の時間）
        if (isForward) {
            updateMiniClock('start', currentHour, currentMinute);
            updateMiniClock('end', endH, endM);
        } else {
            updateMiniClock('start', endH, endM);
            updateMiniClock('end', currentHour, currentMinute);
        }
        
        // タイムラインの描画
        const timeline = document.getElementById('diagram-timeline');
        timeline.innerHTML = ''; // クリア
        
        // タイムラインの計算起点（左側の時刻）を設定
        let earlierH = isForward ? currentHour : endH;
        let earlierM = isForward ? currentMinute : endM;
        
        // 〇時ちょうどの境界をまたぐか計算（常に早い時刻から前向きに計算）
        let splits = [];
        if (earlierM + absDuration >= 60 && absDuration > 0) {
            const toNextHour = 60 - earlierM;
            const remaining = absDuration - toNextHour;
            splits.push(toNextHour);
            if (remaining > 0) splits.push(remaining);
        } else {
            if (absDuration > 0) splits.push(absDuration);
        }
        
        // ベースライン
        const baseLine = document.createElement('div');
        baseLine.className = 'timeline-base';
        timeline.appendChild(baseLine);
        
        // 全体の長さを表現するBOX
        const totalBox = document.createElement('div');
        totalBox.className = 'total-duration-box';
        totalBox.textContent = `${absDuration}分`;
        timeline.appendChild(totalBox);
        
        const totalLine = document.createElement('div');
        totalLine.className = 'total-arrow-line';
        timeline.appendChild(totalLine);

        // 時間経過の矢印と時刻を描画
        const arrowGroup = document.createElement('div');
        arrowGroup.className = 'timeline-arrow-group';
        arrowGroup.style.left = '50%';
        timeline.appendChild(arrowGroup);
        
        // 時間ポイント（開始）
        let tempH = earlierH;
        let tempM = earlierM;
        
        // 左端の時刻
        createTimePoint(timeline, tempH, tempM, '10%', true);
        
        // 分割された矢印を描画
        let currentLeftPercent = 10;
        let stepPercent = 80 / (splits.length || 1); // 全体幅80%を分割
        
        splits.forEach((split, index) => {
            const arrow = document.createElement('div');
            arrow.className = 'timeline-arrow-box';
            arrow.textContent = `${split}分`;
            // 左向き矢印のスタイル（過去に戻る場合）
            if (!isForward) {
                arrow.classList.add('arrow-left');
            }
            
            // 矢印のコンテナ
            const aContainer = document.createElement('div');
            aContainer.style.position = 'absolute';
            aContainer.style.top = '10px';
            aContainer.style.left = `${currentLeftPercent + stepPercent / 2}%`;
            aContainer.style.transform = 'translateX(-50%)';
            aContainer.appendChild(arrow);
            timeline.appendChild(aContainer);
            
            // 次の時刻を計算
            tempM += split;
            if (tempM >= 60) { tempH++; tempM -= 60; }
            if (tempM < 0) { tempH--; tempM += 60; }
            if (tempH >= 24) tempH -= 24;
            if (tempH < 0) tempH += 24;
            
            currentLeftPercent += stepPercent;
            
            // 中間または終了の時刻
            const isLast = (index === splits.length - 1);
            createTimePoint(timeline, tempH, tempM, `${currentLeftPercent}%`, isLast);
        });
    });

    function createTimePoint(container, h, m, left, isEdge = false) {
        const point = document.createElement('div');
        point.className = 'time-point';
        let displayH = h % 12;
        if (displayH === 0) displayH = 12;
        
        // 0分かつ中間地点の時は「〇時」のみで枠なし
        if (m === 0 && !isEdge) {
            point.innerHTML = `<span class="tp-hour">${displayH}時</span>`;
            point.classList.add('time-point-exact');
        } else {
            point.innerHTML = `<span class="tp-hour">${displayH}時</span>${m === 0 ? '' : '<span class="tp-minute">' + m + '分</span>'}`;
        }
        
        point.style.left = left;
        container.appendChild(point);
        
        const line = document.createElement('div');
        line.className = 'time-point-line';
        line.style.left = left;
        container.appendChild(line);
    }

    // 初期化実行
    initClock();
});
