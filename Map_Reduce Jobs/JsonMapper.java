import java.io.IOException;
import org.apache.hadoop.io.*;
import org.apache.hadoop.mapreduce.Mapper;

public class JsonMapper extends Mapper<LongWritable, Text, NullWritable, Text> {

    public void map(LongWritable key, Text value, Context context)
            throws IOException, InterruptedException {

        // Cleaned TSV columns: id, titleType, title, genres, year, rating, votes, runtime
        String[] f = value.toString().split("\t");
        if (f.length < 8) return;

        String id        = f[0];
        String titleType = f[1];
        String title     = f[2].replace("\"", "").replace("\\", "");
        String genres    = f[3];
        String year      = f[4];
        String rating    = f[5];
        String votes     = f[6];
        String runtime   = f[7];

        // Build genres JSON array
        // If genres was defaulted to "0", emit empty array
        String genreJson;
        if (genres.equals("0") || genres.isEmpty()) {
            genreJson = "[]";
        } else {
            String[] genreList = genres.split(",");
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < genreList.length; i++) {
                sb.append("\"").append(genreList[i].trim()).append("\"");
                if (i != genreList.length - 1) sb.append(",");
            }
            sb.append("]");
            genreJson = sb.toString();
        }

        // Parse numeric fields safely
        int releaseYear, votesInt, runtimeInt;
        float ratingFloat;
        try {
            releaseYear = Integer.parseInt(year.trim());
            votesInt    = Integer.parseInt(votes.trim());
            runtimeInt  = Integer.parseInt(runtime.trim());
            ratingFloat = Float.parseFloat(rating.trim());
        } catch (NumberFormatException e) {
            return; // skip malformed rows
        }

        String json = String.format(
            "{\"id\":\"%s\",\"title_type\":\"%s\",\"title\":\"%s\",\"genres\":%s," +
            "\"release_year\":%d,\"rating\":%.1f,\"votes\":%d,\"runtime\":%d}",
            id, titleType, title, genreJson, releaseYear, ratingFloat, votesInt, runtimeInt
        );

        context.write(NullWritable.get(), new Text(json));
    }
}