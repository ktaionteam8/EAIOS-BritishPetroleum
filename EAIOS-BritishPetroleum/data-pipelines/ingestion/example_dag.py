from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator

default_args = {
    "owner": "eaios",
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}

with DAG(
    dag_id="bp_data_ingestion",
    default_args=default_args,
    description="Ingest BP operational data",
    schedule="@daily",
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=["bp", "ingestion"],
) as dag:

    def ingest():
        print("Ingesting BP data...")

    PythonOperator(task_id="ingest_data", python_callable=ingest)
