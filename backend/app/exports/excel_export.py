from io import BytesIO

import pandas as pd


def build_report_excel(rows: list[dict]) -> bytes:
    df = pd.DataFrame(rows)
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="refund_report")
    output.seek(0)
    return output.read()
