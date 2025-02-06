import os
import google.generativeai as genai

# Set your Gemini API key
os.environ['API_KEY'] = 'AIzaSyBnbsdp224poDXOXdez2YSrsnbKT08yluQ'  # Replace with your actual API key
genai.configure(api_key=os.environ['API_KEY'])

def analyze_csv_with_gemini(file_path):
  try:
    # Upload the CSV file to Gemini
    csv_file = genai.upload_file(file_path, mime_type='text/csv')

    # Create a Gemini model instance
    model = genai.GenerativeModel('gemini-1.5-flash')  # Use appropriate model name

    # Generate a prompt for Gemini
    prompt = """Analyze the provided CSV file and generate 15 detailed and professional insights. These insights should cover various aspects of the data, including:

Key Relationships: Identify and describe any significant relationships or correlations between different variables in the dataset. For example, is there a relationship between certain product categories and customer demographics? Quantify these relationships and discuss their potential implications.
Dominant Trends: Analyze the data to uncover any dominant trends or patterns. These could include trends over time, differences across categories, or variations between groups. Provide specific examples and data to support your observations.
Notable Outliers: Identify any notable outliers or anomalies in the data. Discuss what makes these data points unusual and explore possible explanations for their occurrence.
Group Comparisons: Compare and contrast different groups or segments within the data. For example, how do sales figures differ between different customer segments, or how does performance vary across different regions? Highlight any significant differences and analyze the factors driving them.
Actionable Recommendations: Based on your analysis, provide specific and actionable recommendations. These could include areas for improvement, opportunities to capitalize on strengths, or strategies to mitigate potential risks.
Present the insights in a clear and concise manner, using professional language and formatting. Support each insight with data and analysis, and avoid generalizations or vague statements.  Clearly label each insight and structure the output for easy readability."""
    # Send the request to Gemini
    response = model.generate_content([csv_file, prompt])

    # Extract the summary from the response
    summary = response.text

    return summary

  except Exception as e:
    return f"Error analyzing the CSV file: {e}"

# Example usage
file_path = 'backend/sample.csv'  # Replace with your CSV file path
summary = analyze_csv_with_gemini(file_path)
print(summary)