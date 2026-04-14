import java.io.IOException;
import org.apache.hadoop.io.*;
import org.apache.hadoop.mapreduce.Reducer;

public class JsonReducer extends Reducer<NullWritable, Text, NullWritable, Text> {

    public void reduce(NullWritable key, Iterable<Text> values, Context context)
            throws IOException, InterruptedException {

        for (Text val : values) {
            context.write(NullWritable.get(), val);
        }
    }
}