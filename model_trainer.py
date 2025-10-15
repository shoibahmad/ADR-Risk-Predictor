import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score

def train_and_save_model(data_path='clinical_data.csv', model_filename='adr_model.pkl', preprocessor_filename='adr_preprocessor.pkl'):
    """
    Loads synthetic clinical data, trains a multi-class classification model
    to predict ADR Type, and saves the model and preprocessor.
    """
    print(f"Loading data from {data_path}...")
    try:
        df = pd.read_csv(data_path)
    except FileNotFoundError:
        print(f"Error: {data_path} not found. Please run data_generator.py first.")
        return

    # --- 1. Define Features (X) and Target (y) ---
    # We are predicting 'adr_type' (multi-class: 'No ADR' or specific ADR type)
    # The 'time_to_adr_days' and 'adr_outcome' are excluded as they are results, not predictors.
    # 'weight_kg' is excluded since BMI is already a feature (height_cm is not in the dataset).

    X = df.drop(columns=['time_to_adr_days', 'adr_outcome', 'adr_type', 'weight_kg'])
    y = df['adr_type']

    # Convert Categorical features to object type for the preprocessor
    X = X.astype({
        'sex': 'object', 'ethnicity': 'object', 'cyp2c9': 'object', 'cyp2d6': 'object', 
        'indication': 'object'
    })

    # --- 2. Define Preprocessing Steps ---
    # Identify numerical and categorical features
    numerical_features = X.select_dtypes(include=np.number).columns.tolist()
    categorical_features = X.select_dtypes(include=['object']).columns.tolist()
    
    # Create the preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            # Scale numerical features
            ('num', StandardScaler(), numerical_features),
            # One-hot encode categorical features
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ],
        remainder='passthrough' # Keep other columns (none in this case)
    )

    # --- 3. Create Model Pipeline ---
    # We use Logistic Regression as it's a good baseline for multi-class classification
    # and provides feature importance/coefficients (interpretable).
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', LogisticRegression(
            solver='lbfgs', 
            multi_class='multinomial', 
            max_iter=1000, 
            random_state=42, 
            n_jobs=-1
        ))
    ])

    # --- 4. Split Data and Train Model ---
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("Training model...")
    model.fit(X_train, y_train)
    print("Model training complete.")

    # --- 5. Evaluate Model ---
    y_pred = model.predict(X_test)
    print("\n--- Model Evaluation ---")
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    # --- 6. Save Model Artifacts ---
    joblib.dump(model, model_filename)
    joblib.dump(preprocessor, preprocessor_filename)
    
    print(f"\nModel saved successfully to '{model_filename}'")
    print(f"Preprocessor saved successfully to '{preprocessor_filename}'")
    print("The API server can now load these files for predictions.")


if __name__ == '__main__':
    train_and_save_model()
