import { YoutubeTranscript } from "youtube-transcript";

export default async function handler(req, res) {
  try {
    const { videoId } = req.query;

    if (!videoId) {
      return res.status(400).json({
        error: "Missing videoId"
      });
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    const text = transcript.map(line => line.text).join(" ");

    res.status(200).json({
      success: true,
      transcript: text
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Could not fetch transcript"
    });
  }
}
