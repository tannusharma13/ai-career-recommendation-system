"""
Career Model Trainer v3
- XGBoost + Random Forest ensemble  
- Targets >96% accuracy with better-separated profiles
"""
import json, pickle, warnings
import numpy as np, pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import accuracy_score, classification_report
from xgboost import XGBClassifier
warnings.filterwarnings("ignore")

FEATURE_COLUMNS = [
    "logic_math","build_create","help_people","lead_influence",
    "explore_research","nature_outdoors","business_money","risk_ambition",
    "technical_systems","artistic_expression","social_community","structure_detail",
]
MODELS_DIR = Path(__file__).parent.parent / "models"
DATA_PATH  = Path(__file__).parent / "career_dataset.csv"

def train():
    df = pd.read_csv(DATA_PATH)
    print(f"Dataset: {len(df)} rows | {df['top_career'].nunique()} classes")

    X  = df[FEATURE_COLUMNS].values
    le = LabelEncoder()
    y  = le.fit_transform(df["top_career"].values)

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y)
    print(f"Train={len(X_tr)}  Test={len(X_te)}  Classes={len(le.classes_)}")

    scaler   = StandardScaler()
    X_tr_s   = scaler.fit_transform(X_tr)
    X_te_s   = scaler.transform(X_te)

    # ── 1. XGBoost ──────────────────────────────────────────
    print("\n[1/2] XGBoost...")
    xgb = XGBClassifier(
        n_estimators=400, learning_rate=0.07, max_depth=7,
        subsample=0.85, colsample_bytree=0.85,
        min_child_weight=3, gamma=0.1,
        use_label_encoder=False, eval_metric="mlogloss",
        tree_method="hist", random_state=42, n_jobs=-1, verbosity=0
    )
    xgb.fit(X_tr_s, y_tr,
            eval_set=[(X_te_s, y_te)],
            verbose=False)
    xgb_acc = accuracy_score(y_te, xgb.predict(X_te_s))
    print(f"  XGB accuracy : {xgb_acc:.4f}")

    # ── 2. Random Forest ─────────────────────────────────────
    print("\n[2/2] Random Forest...")
    rf = RandomForestClassifier(
        n_estimators=400, max_depth=20, max_features="sqrt",
        min_samples_split=3, min_samples_leaf=1,
        class_weight="balanced", random_state=42, n_jobs=-1)
    rf.fit(X_tr_s, y_tr)
    rf_acc = accuracy_score(y_te, rf.predict(X_te_s))
    print(f"  RF  accuracy : {rf_acc:.4f}")

    # ── Ensemble (60% XGB + 40% RF) ──────────────────────────
    ens_proba = 0.6 * xgb.predict_proba(X_te_s) + 0.4 * rf.predict_proba(X_te_s)
    ens_acc   = accuracy_score(y_te, np.argmax(ens_proba, axis=1))
    print(f"\n  Ensemble acc : {ens_acc:.4f}")

    # ── 5-fold CV on XGB (fast) ──────────────────────────────
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_sc = cross_val_score(
        XGBClassifier(n_estimators=200, learning_rate=0.1, max_depth=6,
                      use_label_encoder=False, eval_metric="mlogloss",
                      tree_method="hist", random_state=42, n_jobs=-1, verbosity=0),
        X_tr_s, y_tr, cv=cv, scoring="accuracy", n_jobs=-1)
    print(f"  5-fold CV    : {cv_sc.mean():.4f} ± {cv_sc.std():.4f}")

    # ── Full report ───────────────────────────────────────────
    print("\nClassification Report (Ensemble):")
    print(classification_report(y_te, np.argmax(ens_proba,axis=1),
                                  target_names=le.classes_, digits=3))

    # ── Feature importance ────────────────────────────────────
    fi = dict(zip(FEATURE_COLUMNS, rf.feature_importances_))
    print("Feature Importances (RF):")
    for feat, imp in sorted(fi.items(), key=lambda x:-x[1]):
        bar = "█" * int(imp * 200)
        print(f"  {feat:<24} {imp:.4f}  {bar}")

    # ── Save ──────────────────────────────────────────────────
    MODELS_DIR.mkdir(exist_ok=True)
    bundle = {"scaler": scaler, "xgb": xgb, "rf": rf,
              "xgb_w": 0.6, "rf_w": 0.4}
    with open(MODELS_DIR / "ensemble_model.pkl", "wb") as f: pickle.dump(bundle, f)
    with open(MODELS_DIR / "label_encoder.pkl",  "wb") as f: pickle.dump(le, f)

    meta = {
        "feature_columns":   FEATURE_COLUMNS,
        "career_classes":    le.classes_.tolist(),
        "xgb_accuracy":      float(xgb_acc),
        "rf_accuracy":       float(rf_acc),
        "ensemble_accuracy": float(ens_acc),
        "cv_mean":           float(cv_sc.mean()),
        "cv_std":            float(cv_sc.std()),
        "n_train":           int(len(X_tr)),
        "n_test":            int(len(X_te)),
        "feature_importance": {k: float(v) for k, v in fi.items()},
    }
    with open(MODELS_DIR / "model_metadata.json", "w") as f: json.dump(meta, f, indent=2)

    print(f"\n✅ All models saved to {MODELS_DIR}")
    print(f"   Best accuracy: {max(xgb_acc, rf_acc, ens_acc):.4f}")
    return bundle, le, meta

if __name__ == "__main__":
    print("=" * 55)
    print("  CAREER AI  —  MODEL TRAINING v3 (XGBoost Ensemble)")
    print("=" * 55)
    train()
