// DOM要素の取得
const initialAmountInput = document.getElementById('initialAmount');
const monthlyAmountInput = document.getElementById('monthlyAmount');
const annualRateInput = document.getElementById('annualRate');
const yearsInput = document.getElementById('years');

const finalAmountElement = document.getElementById('finalAmount');
const totalInvestmentElement = document.getElementById('totalInvestment');
const totalProfitElement = document.getElementById('totalProfit');
const resultsListElement = document.getElementById('resultsList');
const calculationFormulaElement = document.getElementById('calculationFormula');

// 計算方法の切り替えボタン
const monthlyCompoundBtn = document.getElementById('monthlyCompound');
const annualCompoundBtn = document.getElementById('annualCompound');

// 計算方法の状態（デフォルトは月次複利）
let calculationType = 'monthly';

// 入力値の変更を監視
[initialAmountInput, monthlyAmountInput, annualRateInput, yearsInput].forEach(input => {
    input.addEventListener('input', calculateAndUpdate);
    input.addEventListener('change', calculateAndUpdate);
});

// 計算方法の切り替えイベント
monthlyCompoundBtn.addEventListener('click', () => {
    calculationType = 'monthly';
    updateCalculationButtons();
    calculateAndUpdate();
});

annualCompoundBtn.addEventListener('click', () => {
    calculationType = 'annual';
    updateCalculationButtons();
    calculateAndUpdate();
});

// 初期計算
document.addEventListener('DOMContentLoaded', calculateAndUpdate);

// 積み立て計算と更新
function calculateAndUpdate() {
    const initialAmount = (parseFloat(initialAmountInput.value) || 0) * 10000; // 万円を円に変換
    const monthlyAmount = (parseFloat(monthlyAmountInput.value) || 0) * 10000; // 万円を円に変換
    const annualRate = parseFloat(annualRateInput.value) || 0;
    const years = parseInt(yearsInput.value) || 0;

    if (years <= 0) {
        clearResults();
        return;
    }

    const results = calculateCompoundInterest(initialAmount, monthlyAmount, annualRate, years);
    updateSummary(results);
    updateResultsList(results);
    updateCalculationFormula(initialAmount, monthlyAmount, annualRate);
}

// 複利計算
function calculateCompoundInterest(initialAmount, monthlyAmount, annualRate, years) {
    const results = [];
    let currentAmount = initialAmount;
    let totalInvestment = initialAmount;
    let totalProfit = 0;

    if (calculationType === 'monthly') {
        // 月次複利計算
        const monthlyRate = annualRate / 100 / 12;
        
        for (let year = 1; year <= years; year++) {
            const yearStartAmount = currentAmount;
            
            // 1年分の積み立てと複利計算
            for (let month = 1; month <= 12; month++) {
                currentAmount += monthlyAmount;
                currentAmount *= (1 + monthlyRate);
                totalInvestment += monthlyAmount;
            }

            const yearEndAmount = currentAmount;
            const yearProfit = yearEndAmount - yearStartAmount - (monthlyAmount * 12);
            totalProfit = yearEndAmount - totalInvestment;

            results.push({
                year: year,
                totalInvestment: totalInvestment,
                totalMonthlyInvestment: monthlyAmount * 12 * year,
                totalProfit: totalProfit,
                total: yearEndAmount
            });
        }
    } else {
        // 年利計算
        const annualRateDecimal = annualRate / 100;
        
        for (let year = 1; year <= years; year++) {
            const yearStartAmount = currentAmount;
            
            // 1年分の積み立て
            currentAmount += monthlyAmount * 12;
            totalInvestment += monthlyAmount * 12;
            
            // 年利を適用
            currentAmount *= (1 + annualRateDecimal);

            const yearEndAmount = currentAmount;
            const yearProfit = yearEndAmount - yearStartAmount - (monthlyAmount * 12);
            totalProfit = yearEndAmount - totalInvestment;

            results.push({
                year: year,
                totalInvestment: totalInvestment,
                totalMonthlyInvestment: monthlyAmount * 12 * year,
                totalProfit: totalProfit,
                total: yearEndAmount
            });
        }
    }

    return {
        results: results,
        finalAmount: currentAmount,
        totalInvestment: totalInvestment,
        totalProfit: totalProfit
    };
}

// サマリー更新
function updateSummary(data) {
    finalAmountElement.textContent = formatCurrency(data.finalAmount);
    totalInvestmentElement.textContent = formatCurrency(data.totalInvestment);
    totalProfitElement.textContent = formatCurrency(data.totalProfit);
}

// 結果リスト更新
function updateResultsList(data) {
    resultsListElement.innerHTML = '';
    
    data.results.forEach(result => {
        const row = document.createElement('div');
        row.className = 'result-row';
        
        row.innerHTML = `
            <span>${result.year}年</span>
            <span>${formatCurrency(result.totalInvestment)}</span>
            <span>${formatCurrency(result.totalMonthlyInvestment)}</span>
            <span>${formatCurrency(result.totalProfit)}</span>
            <span>${formatCurrency(result.total)}</span>
        `;
        
        resultsListElement.appendChild(row);
    });
}

// 計算式更新
function updateCalculationFormula(initialAmount, monthlyAmount, annualRate) {
    let formulaHTML = '';
    
    if (calculationType === 'monthly') {
        // 月次複利計算の説明
        const monthlyRate = annualRate / 100 / 12;
        
        // 12ヶ月分の計算をループで実行
        let baseAmount = 0;
        let currentAmount = initialAmount;
        let monthlyDetails = [];
        
        for (let month = 1; month <= 12; month++) {
            // １年目は初期投資額、2年目以降は前年度の繰り越し総額
            if(baseAmount == 0) {
                baseAmount = initialAmount;
            }else{
                baseAmount += monthlyAmount;
                baseAmount = baseAmount * Math.pow(1 + monthlyRate, month - 1);
            }
            currentAmount += monthlyAmount;
            currentAmount = currentAmount * Math.pow(1 + monthlyRate, 1);
            monthlyDetails.push({
                month: month,
                baseAmount: baseAmount,
                amount: currentAmount
            });
        }
        
        formulaHTML = `
            <div class="formula-step">
                <div class="formula-title">月次複利計算（1年目）</div>
                <div class="formula-detail">
                    初期投資: ${initialAmount.toLocaleString()}円<br>
                    積み立て: ${monthlyAmount.toLocaleString()}円/月<br>
                    月次利率: 年利${annualRate}% ÷ 12<br><br>
                    
                    <strong>計算過程:</strong><br>
                    ${monthlyDetails.map(detail => 
                        `${detail.month}月目: (${(detail.baseAmount).toLocaleString()} + ${monthlyAmount.toLocaleString()}) × (1 + (${annualRate} ÷ 100 ÷ 12) = ${detail.amount.toLocaleString()}円`
                    ).join('<br>')}
                </div>
            </div>
        `;
    } else {
        // 年利計算の説明
        const annualRateDecimal = annualRate / 100;
        
        // 積み立て後の金額
        const afterInvestment = initialAmount + monthlyAmount * 12;
        // 年利適用後の金額
        const afterInterest = Math.floor(afterInvestment * (1 + annualRateDecimal));
        
        formulaHTML = `
            <div class="formula-step">
                <div class="formula-title">年利計算（1年目）</div>
                <div class="formula-detail">
                    初期投資: ${initialAmount.toLocaleString()}円<br>
                    積み立て: ${monthlyAmount.toLocaleString()}円/月 × 12ヶ月 = ${(monthlyAmount * 12).toLocaleString()}円<br>
                    年利率: ${annualRate}%<br><br>
                    
                    <strong>計算過程:</strong><br>
                    1. 積み立て後の金額: ${initialAmount.toLocaleString()} + ${(monthlyAmount * 12).toLocaleString()} = ${afterInvestment.toLocaleString()}円<br>
                    2. 年利適用: ${afterInvestment.toLocaleString()} × (1 + ${annualRate}%) = ${afterInterest.toLocaleString()}円<br>
                    3. 最終資産: ${afterInterest.toLocaleString()}円
                </div>
            </div>
        `;
    }
    
    calculationFormulaElement.innerHTML = formulaHTML;
}

// 結果クリア
function clearResults() {
    finalAmountElement.textContent = '¥0';
    totalInvestmentElement.textContent = '¥0';
    totalProfitElement.textContent = '¥0';
    resultsListElement.innerHTML = '';
    calculationFormulaElement.innerHTML = '';
}

// 通貨フォーマット
function formatCurrency(amount) {
    if (amount === 0) return '0';
    
    // 小数点以下を切り捨てる
    const floorAmount = Math.floor(amount);
    const sign = amount < 0 ? '-' : '';
    
    return `${sign}${Math.round(floorAmount).toLocaleString()}`;
}

// 入力値のバリデーション
function validateInputs() {
    const initialAmount = parseFloat(initialAmountInput.value);
    const monthlyAmount = parseFloat(monthlyAmountInput.value);
    const annualRate = parseFloat(annualRateInput.value);
    const years = parseInt(yearsInput.value);

    // 入力値の範囲チェック
    if (initialAmount < 0) {
        initialAmountInput.value = 0;
    }
    
    if (monthlyAmount < 0) {
        monthlyAmountInput.value = 0;
    }
    
    if (annualRate < 0) {
        annualRateInput.value = 0;
    } else if (annualRate > 20) {
        annualRateInput.value = 20;
    }
    
    if (years < 1) {
        yearsInput.value = 1;
    } else if (years > 50) {
        yearsInput.value = 50;
    }
}

// 入力値の変更時にバリデーション実行
[initialAmountInput, monthlyAmountInput, annualRateInput, yearsInput].forEach(input => {
    input.addEventListener('blur', validateInputs);
});

// 数値入力の改善（カンマ区切りなど）
function improveNumberInput(input) {
    input.addEventListener('blur', function() {
        const value = parseFloat(this.value);
        if (!isNaN(value)) {
            this.value = value;
        }
    });
}

// 数値入力の改善を適用
[initialAmountInput, monthlyAmountInput, annualRateInput, yearsInput].forEach(improveNumberInput);

// キーボードショートカット
document.addEventListener('keydown', function(e) {
    // Ctrl + Enter で計算実行
    if (e.ctrlKey && e.key === 'Enter') {
        calculateAndUpdate();
    }
    
    // Escape でフォーカスを外す
    if (e.key === 'Escape') {
        document.activeElement.blur();
    }
});

// ボタンの状態を更新
function updateCalculationButtons() {
    if (calculationType === 'monthly') {
        monthlyCompoundBtn.classList.add('active');
        annualCompoundBtn.classList.remove('active');
    } else {
        annualCompoundBtn.classList.add('active');
        monthlyCompoundBtn.classList.remove('active');
    }
}

// パフォーマンス最適化（デバウンス）
let calculationTimeout;
function debouncedCalculate() {
    clearTimeout(calculationTimeout);
    calculationTimeout = setTimeout(calculateAndUpdate, 100);
}

// 入力値の変更時にデバウンス適用
[initialAmountInput, monthlyAmountInput, annualRateInput, yearsInput].forEach(input => {
    input.addEventListener('input', debouncedCalculate);
});
