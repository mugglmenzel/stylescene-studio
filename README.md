# StyleScene

StyleScene is a web application that allows users to generate photorealistic images by combining a person's image, a clothing item, and a scene description. It uses AI to create a new image based on these inputs.

## Core Features

-   **Image Upload**: Upload images of a person and a piece of clothing.
-   **Scene Description**: Describe the scene you want to create.
-   **AI Image Generation**: A new, photorealistic image is generated based on your inputs.
-   **Download**: Save the generated image.

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/en/download/package-manager) (v20 or later)
-   [gcloud CLI](https://cloud.google.com/sdk/docs/install)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/mugglmenzel/stylescene-studio.git
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```

### Running Locally

1.  Run `gcloud init` to authenticate and set up your Google Cloud project.
2.  Create a `.env` file in the root of the project. You can use the `.env.template` file as a reference. You will need to set the `GCP_PROJECT` variable to your Google Cloud project ID.
3.  Run the development server:
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:9002](http://localhost:9002).

## Deployment

This application is configured for deployment to Google Cloud Run.

To deploy the application, run the following command:

```bash
gcloud run deploy stylescene-studio --source .
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the [Apache 2.0 License](LICENSE).