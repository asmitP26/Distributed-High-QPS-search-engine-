import java.io.IOException;
import org.apache.hadoop.io.*;
import org.apache.hadoop.mapreduce.Mapper;

public class CleanMapper extends Mapper<LongWritable, Text, Text, Text> {

    public void map(LongWritable key, Text value, Context context)
            throws IOException, InterruptedException {

        String line = value.toString();
        if (line.startsWith("tconst")) return;

        String[] f = line.split("\t");
        if (f.length < 11) return;

        String id        = f[0];
        String titleType = f[1];
        String title     = f[3];  // originalTitle
        String year      = f[5];  // startYear
        String runtime   = f[7];  // runtimeMinutes
        String genres    = f[8];
        String rating    = f[9];  // averageRating
        String votes     = f[10]; // numVotes

        // Hard drops — rule 1
        if (id.equals("\\N") || title.equals("\\N") || year.equals("\\N")) return;

        // Default to 0 — rule 2
        if (titleType.equals("\\N") titleType = "0";
        if (runtime.equals("\\N")) runtime = "0";
        if (genres.equals("\\N"))  genres  = "0";
        if (rating.equals("\\N"))  rating  = "0";
        if (votes.equals("\\N"))   votes   = "0";

        // Emit only the columns Solr needs — rule 3
        String out = id + "\t" + titleType + "\t" + title + "\t" + genres
                   + "\t" + year + "\t" + rating + "\t" + votes + "\t" + runtime;

        context.write(new Text(id), new Text(out));
    }
}