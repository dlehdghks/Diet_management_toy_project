import random
import re

FOOD_DB = {
    "proteins": [
        {"name": "닭가슴살 150g", "cal": 250, "pro": 45, "car": 0, "fat": 5},
        {"name": "돼지목살 구이 150g", "cal": 330, "pro": 30, "car": 0, "fat": 22},
        {"name": "훈제오리 120g", "cal": 380, "pro": 22, "car": 1, "fat": 32},
        {"name": "소고기 안심 150g", "cal": 280, "pro": 40, "car": 0, "fat": 12},
        {"name": "고등어 구이 150g", "cal": 350, "pro": 28, "car": 0, "fat": 25},
        {"name": "두부 200g (1/2모)", "cal": 160, "pro": 16, "car": 4, "fat": 9},
        {"name": "삶은 계란 2개", "cal": 155, "pro": 13, "car": 1, "fat": 11},
        {"name": "단백질 쉐이크 1회분", "cal": 120, "pro": 24, "car": 3, "fat": 1},
    ],
    "carbs": [
        {"name": "현미밥 200g (1공기)", "cal": 300, "pro": 6, "car": 65, "fat": 2},
        {"name": "찐 고구마 150g", "cal": 200, "pro": 2, "car": 45, "fat": 0.2},
        {"name": "통밀 식빵 2장", "cal": 200, "pro": 8, "car": 38, "fat": 2},
        {"name": "바나나 1개", "cal": 90, "pro": 1, "car": 23, "fat": 0.3},
        {"name": "사과 1개", "cal": 95, "pro": 1, "car": 25, "fat": 0.3},
        {"name": "찐 감자 200g", "cal": 150, "pro": 4, "car": 35, "fat": 0.2},
    ],
    "sides": [
        {"name": "브로콜리 80g", "cal": 30, "pro": 3, "car": 5, "fat": 0.3},
        {"name": "양상추 샐러드 100g", "cal": 15, "pro": 1, "car": 3, "fat": 0.1},
        {"name": "방울토마토 10알", "cal": 30, "pro": 1, "car": 7, "fat": 0.2},
        {"name": "아몬드 10알", "cal": 70, "pro": 2, "car": 2, "fat": 6},
        {"name": "그릭 요거트 100g", "cal": 90, "pro": 10, "car": 4, "fat": 3},
        {"name": "시금치 나물 50g", "cal": 40, "pro": 2, "car": 3, "fat": 3},
        {"name": "파프리카 1개", "cal": 30, "pro": 1, "car": 6, "fat": 0.2},
        {"name": "아보카도 1/2개", "cal": 160, "pro": 2, "car": 8, "fat": 15},
    ]
}

def calculate_calories(user_data):
    h, w, a = user_data.get('height', 0), user_data.get('weight', 0), user_data.get('age', 0)
    g, al, goal = user_data.get('gender', 'male'), user_data.get('activity_level', 'medium'), user_data.get('goal', 'maintain')
    
    if not all([h, w, a]): return None
    
    if g == "male": bmr = (10 * w) + (6.25 * h) - (5 * a) + 5
    else: bmr = (10 * w) + (6.25 * h) - (5 * a) - 161
    
    multipliers = {"low": 1.2, "medium": 1.55, "high": 1.9}
    tdee = bmr * multipliers.get(al, 1.55)
    target = tdee - 500 if goal == "loss" else (tdee + 500 if goal == "gain" else tdee)
    
    reason = f"건강한 감량을 위해 TDEE에서 500kcal를 차감했습니다." if goal == "loss" else (f"근성장을 위해 TDEE에 500kcal를 추가했습니다." if goal == "gain" else "체중 유지를 위한 일일 총 소비량입니다.")
    
    return {
        "bmr": round(bmr), 
        "tdee": round(tdee), 
        "target_calories": round(target), 
        "calculation_reason": reason,
        "evidence": {
            "source": "Mifflin-St Jeor (표준 공식)", 
            "description": "표준 공식을 기반으로 산출되었습니다.", 
            "formula": "10W + 6.25H - 5A + (5 or -161)"
        }
    }

def scale_food(food, factor):
    if factor == 1.0: return food
    new_food = food.copy()
    def replace_weight(match):
        val = int(match.group(1))
        return f"{int(val * factor)}g"
    new_name = re.sub(r'(\d+)g', replace_weight, food['name'])
    if new_name == food['name']:
        new_name = f"{food['name']} x{factor:.1f}"
    new_food['name'] = new_name
    new_food['cal'] = round(food['cal'] * factor)
    new_food['pro'] = round(food['pro'] * factor)
    new_food['car'] = round(food['car'] * factor)
    new_food['fat'] = round(food['fat'] * factor)
    return new_food

def find_best_combination(target_cal, base_count):
    best_meal = []
    min_diff = float('inf')
    for _ in range(100):
        p_base = random.choice(FOOD_DB["proteins"])
        c_base = random.choice(FOOD_DB["carbs"])
        factor = 1.0
        if target_cal > 800: factor = 2.0
        elif target_cal > 600: factor = 1.5
        elif target_cal > 450: factor = 1.2
        current_trial = [scale_food(p_base, factor), scale_food(c_base, factor)]
        remaining_cal = target_cal - sum(f['cal'] for f in current_trial)
        if remaining_cal > 50:
            side_count = 1 if remaining_cal < 150 else 2
            current_trial.extend(random.sample(FOOD_DB["sides"], side_count))
        trial_cal = sum(f["cal"] for f in current_trial)
        diff = abs(trial_cal - target_cal)
        if diff < min_diff:
            min_diff = diff
            best_meal = current_trial
    return best_meal

def get_diet_recommendation(goal, target_calories):
    options = []
    for _ in range(3):
        b_target = target_calories * 0.25
        l_target = target_calories * 0.40
        d_target = target_calories * 0.35
        b = find_best_combination(b_target, 2)
        l = find_best_combination(l_target, 3)
        d = find_best_combination(d_target, 3)
        all_foods = b + l + d
        options.append({
            "total_info": {
                "cal": round(sum(f['cal'] for f in all_foods)),
                "pro": round(sum(f['pro'] for f in all_foods)),
                "car": round(sum(f['car'] for f in all_foods)),
                "fat": round(sum(f['fat'] for f in all_foods))
            },
            "meals": {"아침": b, "점심": l, "저녁": d}
        })
    return {"options": options, "youtube_links": []}
